"use server"

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