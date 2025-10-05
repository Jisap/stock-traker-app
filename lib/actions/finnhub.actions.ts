"use server"

import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { POPULAR_STOCK_SYMBOLS } from "../constants";
import { getSession } from "../better-auth/auth";
import { headers } from "next/headers";
import { getWatchlistSymbolsByEmail } from "./watchlist.actions";
import { formatArticle, getDateRange, validateArticle } from "../utils";

// Constantes para la API de Finnhub.
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

/**
 * Función de utilidad genérica para realizar peticiones fetch y parsear la respuesta como JSON.
 * Implementa la estrategia de caché de Next.js para optimizar las peticiones.
 * @template T El tipo de dato esperado en la respuesta JSON.
 * @param {string} url                 La URL a la que se hará la petición.
 * @param {number} [revalidateSeconds] - Opcional. El número de segundos tras los cuales la caché debe revalidarse.
 *                                     - Si se proporciona, usa 'force-cache' con revalidación.
 *                                     - Si se omite, usa 'no-store' para no cachear la respuesta.
 * @returns {Promise<T>}               Una promesa que se resuelve con los datos JSON.
 * @throws {Error}                     Si la petición fetch falla o la respuesta no es 'ok'.
 */

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  
  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds  // Configura las opciones de caché de Next.js.
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  
  const res = await fetch(url, options);                                               // Realiza la petición fetch.
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export { fetchJSON };

/**
 * Obtiene noticias del mercado. Si se proporcionan símbolos de acciones, intenta obtener
 * noticias específicas de esas compañías. Si no, o si no encuentra noticias específicas,
 * recurre a noticias generales del mercado.
 *
 * @param {string[]} [symbols] - Un array opcional de símbolos de acciones (ej. ['AAPL', 'GOOGL']).
 * @returns {Promise<MarketNewsArticle[]>} Una promesa que se resuelve con un array de hasta 6 artículos de noticias.
 * @throws {Error} Si la clave de la API no está configurada o si la petición de noticias falla.
 */
export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    // 1. CONFIGURACIÓN INICIAL
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB API key is not configured');
    }
    // Limpia y formatea los símbolos de entrada.
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // 2. OBTENER NOTICIAS DE COMPAÑÍAS (SI SE PROPORCIONAN SÍMBOLOS)
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      // Realiza peticiones para cada símbolo en paralelo para mayor eficiencia.
      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
            // Usa caché de 5 minutos (300s) para estas peticiones.
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            // Si falla la petición para un símbolo, no detiene el resto.
            console.error('Error fetching company news for', sym, e);
            perSymbolArticles[sym] = [];
          }
        })
      );

      // 3. SELECCIÓN "ROUND-ROBIN" PARA BALANCEAR LAS NOTICIAS
      //    Este algoritmo asegura que se muestren noticias de diferentes compañías
      //    en lugar de mostrar solo las de la primera compañía de la lista.
      const collected: MarketNewsArticle[] = [];
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          // Extrae y elimina el primer artículo de la lista del símbolo.
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Ordena las noticias recolectadas por fecha, de más reciente a más antigua.
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // Si no se recolectó ninguna noticia de compañía, se pasará a buscar noticias generales.
    }

    // 4. FALLBACK: OBTENER NOTICIAS GENERALES DEL MERCADO
    //    Se ejecuta si no se proporcionaron símbolos o si no se encontraron noticias para ellos.
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    // 5. DEDUPLICACIÓN DE NOTICIAS GENERALES
    //    La API de noticias generales a veces devuelve duplicados.
    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      // Crea una clave única para cada artículo para detectar duplicados.
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break; // cap early before final slicing
    }

    // 6. FORMATEO Y RETORNO FINAL
    const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error('getNews error:', err);
    // Lanza un error genérico para que el componente que la llama pueda manejarlo.
    throw new Error('Failed to fetch news');
  }
}

/**
 * Obtiene la cotización en tiempo real para un símbolo de acción específico.
 * @param {string} symbol - El símbolo de la acción (ej. 'AAPL').
 * @returns {Promise<FinnhubQuote>} Una promesa que se resuelve con los datos de la cotización.
 */
export async function getQuote(symbol: string): Promise<FinnhubQuote> {
  // noStore() previene que esta petición sea cacheada, asegurando datos en tiempo real.
  noStore();
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB API key is not configured');
    }

    const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
    // No usamos caché (`revalidateSeconds`) para obtener siempre el último precio.
    return await fetchJSON<FinnhubQuote>(url);
  } catch (err) {
    console.error(`getQuote error for ${symbol}:`, err);
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }
}

/**
 * Busca acciones por un término de búsqueda o devuelve una lista de acciones populares si no se proporciona un término.
 * Es una Server Action que se ejecuta en el servidor y utiliza `cache` de React para memoizar los resultados
 * durante el ciclo de vida de una petición, evitando búsquedas duplicadas.
 *
 * @param {string} [query] - El término de búsqueda para las acciones.
 * @returns {Promise<StockWithWatchlistStatus[]>} Una promesa que se resuelve con un array de acciones.
 */

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {

  const session = await getSession({ headers: await headers() });                                                // Obtenemos la sesión del usuario para saber quién está haciendo la petición.
  const user = session?.user;
  
  const watchlistSymbols = user?.email                                                                           // Obtenemos la lista de símbolos en la watchlist del usuario. Si no hay usuario, es un array vacío.
    ? await getWatchlistSymbolsByEmail(user.email)
    : [];
    
  try {
    
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;                                    // 1. OBTENER LA CLAVE DE LA API
    if (!token) {
      
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));                   // Si no hay token, se registra un error y se devuelve un array vacío para no romper la aplicación.
      return [];
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';                                               // Limpia el término de búsqueda de espacios en blanco.

    let results: FinnhubSearchResult[] = [];

      
    if (!trimmed) {                                                                                               // 2. LÓGICA DE BÚSQUEDA. Si no hay término de búsqueda, se obtienen las acciones populares.
      
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);                                                             // Se toman los primeros 10 símbolos de la lista de acciones populares.
      
      const profiles = await Promise.all(                                                                         // Se realizan peticiones en paralelo para obtener el perfil de cada acción.
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            
            const profile = await fetchJSON<any>(url, 3600);                                                      // Se cachea el resultado durante 1 hora (3600s) para optimizar. 
            return { sym, profile } as { sym: string; profile: any };
          
          } catch (e) {                                                                                           // Si una petición falla, se registra el error y se continúa con las demás.
            
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null } as { sym: string; profile: any };
          }
        })
      );
   
      results = profiles                                                                                          // Se transforman los perfiles obtenidos al formato `FinnhubSearchResult`.
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          
          if (!name) return undefined;                                                                            // Si no hay nombre, se descarta el resultado.

          const r: FinnhubSearchResult = {                                                                        // Se construye el objeto final. Este array puede tener objetos FinnHubSearchResult como valores undefined
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
          };
          // Truco: Se adjunta el 'exchange' al objeto de forma interna para pasarlo
          // a la siguiente fase de mapeo, ya que `FinnhubSearchResult` no lo incluye.
          (r as any).__exchange = exchange;
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));                                                      // Se filtran los resultados que no se pudieron procesar (los undefined). Solo los objetos (x) que son FinnHubSearchResult son devueltos.
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;                    // Si hay un término de búsqueda, se usa el endpoint de búsqueda de Finnhub.
      
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);                                              // Se cachea el resultado durante 30 minutos (1800s).
      results = Array.isArray(data?.result) ? data.result : [];
    }

    
    
    const mapped: StockWithWatchlistStatus[] = results                                                             // 3. MAPEO FINAL Y NORMALIZACIÓN
      .map((r) => {                                                                                                // Se mapean los resultados (ya sean de populares o de búsqueda) al tipo final `StockWithWatchlistStatus`.
        
        const upper = (r.symbol || '').toUpperCase();                                                              // Normalización de datos. 1º si existe un symbol se pasa a mayúsculas y sino existe se sustituye por ""
        const name = r.description || upper;                                                                       // Luego se toma el nombre o el símbolo si no existe el nombre.
        
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;                          // Despues se intenta normalizar la BOLSA (Exchange). 1º Se intenta obtener el 'exchange' de `r.displaySymbol`
        const exchangeFromProfile = (r as any).__exchange as string | undefined;                                   // Si no lo encuentra, intenta obtenerlo de `__exchange`, la propiedad interna que añadimos para las acciones populares.
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';                                       // Si sigue sin encontrarlo, asume 'US'(bolsas de Estados Unidos) como valor por defecto.
        
        const type = r.type || 'Stock';                                                                            // 4. Normalizar el TIPO

        
        const item: StockWithWatchlistStatus = {                                                                   // 5º Construir el Objeto Final Normalizado
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: watchlistSymbols.includes(upper), // Comprobamos si el símbolo está en la lista del usuario.
        };
        return item;
      })
      
      .slice(0, 15);                                                                                               // Se limita el resultado a un máximo de 15 elementos.

    return mapped;
  } catch (err) {
    console.error('Error in stock search:', err);                                                                  // Manejo de errores
    return [];
  }
});