'use server';

import { Watchlist } from '@/database/models/watchlist.models';
import { connectToDatabase } from '@/database/mongoose';

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