'use server';

import { revalidatePath } from 'next/cache';
import { Watchlist } from '@/database/models/watchlist.models';
import { connectToDatabase } from '@/database/mongoose';;
import { getSession } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { getQuote } from './finnhub.actions';

/**
 * Obtiene los símbolos (AAPL, MSFT, GOOGL, etc) de la lista de seguimiento (watchlist) de un usuario a partir de su email.
 * Es una Server Action que se ejecuta de forma segura en el servidor.
 * @param email El email del usuario.
 * @returns Una promesa que se resuelve con un array de strings (símbolos).
 */
export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  
  if (!email) return [];                                               // 1. Validación de entrada: Si no se proporciona un email, devuelve un array vacío.

  try {
    
    const mongoose = await connectToDatabase();                        // 2. Conexión a la base de datos.
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    
    
    const user =                                                       // 3. Búsqueda del usuario: Encuentra el documento del usuario en la colección 'user' usando su email.
      await db                                                         //    La librería `better-auth` almacena los usuarios en esta colección.  
        .collection('user').findOne<{ 
          _id?: unknown; // identificador de mongo
          id?: string;   // identificador de better-auth
          email?: string // email del usuario
        }>({ email });

   
    if (!user) return [];                                              // Si el usuario no existe, no hay nada que devolver.

    
    const userId = (user.id as string) || String(user._id || '');      // 4. Extracción del ID de usuario: Obtiene el ID del usuario, compatible con `better-auth` (campo 'id') o MongoDB (campo '_id'). 
    if (!userId) return [];

    
    
    
    const items =                                                       // 5. Búsqueda en la Watchlist: Utiliza el modelo `Watchlist` para encontrar todos los items que coincidan con el `userId`.   
      await Watchlist.find(                                             //    - `{ symbol: 1 }`: Proyección para que la consulta solo devuelva el campo 'symbol', optimizando el rendimiento.
        { userId },                                                     //    - `.lean()`: Devuelve objetos JavaScript simples en lugar de documentos Mongoose completos, lo que es más rápido.
        { symbol: 1 }
      ).lean();
    
      return items.map((i) => String(i.symbol));                        // 6. Formateo del resultado: Convierte la lista de objetos en un array de strings (símbolos).
  } catch (err) {
    
    console.error('getWatchlistSymbolsByEmail error:', err);            // 7. Manejo de errores: Si algo falla, lo registra y devuelve un array vacío para evitar que el proceso que la llama se bloquee.
    return [];
  }
}

/**
 * Obtiene los items de la watchlist de un usuario con sus cotizaciones actuales.
 * @param email El email del usuario.
 * @returns Una promesa que se resuelve con un array de `WatchlistItem`.
 */
export async function getWatchlistByEmail(email: string): Promise<WatchlistItem[]> {
  if (!email) return [];

  try {
    // 1. Obtener los símbolos de la watchlist del usuario.
    const symbols = await getWatchlistSymbolsByEmail(email);
    if (symbols.length === 0) return [];

    // 2. Para cada símbolo, obtener su cotización actual en paralelo.
    const watchlistWithQuotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote = await getQuote(symbol);
          return {
            symbol,
            company: symbol, // Podríamos obtener el nombre real de la compañía aquí
            price: quote.c,
            change: quote.d,
            changePercent: quote.dp,
            marketCap: 0, // Este dato no viene en la cotización simple
            peRatio: 0,   // Este dato no viene en la cotización simple
          };
        } catch (error) {
          console.error(`Failed to get quote for ${symbol}`, error);
          // Si falla la cotización de un símbolo, devolvemos un item parcial.
          return {
            symbol,
            company: symbol,
            price: 0,
            change: 0,
            changePercent: 0,
            marketCap: 0,
            peRatio: 0,
          };
        }
      })
    );

    return watchlistWithQuotes;
  } catch (err) {
    console.error('getWatchlistByEmail error:', err);
    return [];
  }
}

/**
 * Añade o elimina un símbolo de la watchlist del usuario actual.
 * Es una Server Action que se ejecuta de forma segura en el servidor.
 * @param symbol El símbolo de la acción a modificar.
 * @param isAdding `true` para añadir, `false` para eliminar.
 * @returns Un objeto indicando el éxito de la operación.
 */
export async function updateWatchlist(symbol: string, isAdding: boolean) {
  try {
    await connectToDatabase();
    const session = await getSession({ headers: await headers() }); // This will now work correctly on the server
    const user = session?.user;

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    if (isAdding) {
      // Usamos findOneAndUpdate con `upsert: true` para crear el documento si no existe.
      // Esto previene duplicados gracias al índice único en el modelo.
      await Watchlist.findOneAndUpdate(
        { userId: user.id, symbol },
        { userId: user.id, symbol, company: symbol }, // Asumimos company = symbol por simplicidad
        { upsert: true, new: true }
      );
    } else {
      // Elimina el documento que coincide con el userId y el símbolo.
      await Watchlist.deleteOne({ userId: user.id, symbol });
    }

    // Revalida la ruta del dashboard para que la lista de la watchlist se actualice.
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('updateWatchlist error:', error);
    return { success: false, error: 'Failed to update watchlist' };
  }
}