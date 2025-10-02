'use server';

import { connectToDatabase } from "@/database/mongoose";

/**
 * Obtiene todos los usuarios elegibles para recibir el correo de noticias.
 * Es una Server Action que se ejecuta de forma segura en el servidor.
 */

export const getAllUsersForNewsEmail = async () => {
  try {
   
    const mongoose = await connectToDatabase();                                    // 1. Conecta a la base de datos MongoDB.
    const db = mongoose.connection.db;
    if (!db) throw new Error('Mongoose connection not connected');

    
    const users = await db.collection('user').find(                                // 2. Busca todos los usuarios que tengan un email registrado.
      { email: { $exists: true, $ne: null } },                                     // Filtro: Selecciona solo documentos donde el campo 'email' existe y no es nulo.
      { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }             // Proyección: Optimiza la consulta para devolver solo los campos necesarios, reduciendo la carga de datos y mejorando el rendimiento.
    ).toArray();                                                                   // Convierte el cursor de resultados en un array.

    
    return users.filter((user) => user.email && user.name).map((user) => ({        // 3. Procesa y formatea los resultados para asegurar un formato consistente.
      id: user.id || user._id?.toString() || '',                                   // Normaliza el ID, usando `user.id` o convirtiendo `_id` a string.
      email: user.email,
      name: user.name
    }))
  } catch (e) {
    console.error('Error fetching users for news email:', e)                       // 4. En caso de error, lo registra en la consola y devuelve un array vacío. 
    return []                                                                      // Esto previene que el proceso que llama a esta función (ej. envío de correos) falle.
  }
}