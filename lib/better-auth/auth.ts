import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

/**
 * Obtiene la instancia singleton de `betterAuth`.
 * Utiliza un patrón de caché para asegurar que la conexión a la base de datos
 * y la inicialización de `betterAuth` ocurran solo una vez.
 * @returns Una promesa que se resuelve con la instancia de `betterAuth`.
 */

export const getAuth = async () => { 
  
  if (authInstance) return authInstance;                                                       // Si la instancia ya está en caché, la retornamos para evitar reinicializaciones.
  
  const mongoose = await connectToDatabase();                                                  // Establece la conexión con la base de datos usando nuestro singleton de Mongoose.
  
  const db = mongoose.connection.db;                                                           // Obtenemos el objeto de base de datos nativo de MongoDB, requerido por el adaptador.
  
  
  if (!db) throw new Error('No se pudo obtener la conexión a la base de datos de MongoDB.');   // Verificación de seguridad para asegurar que la conexión a la BD fue exitosa.
  
  // Creamos y configuramos la instancia de `betterAuth`.
  authInstance = betterAuth({
    database: mongodbAdapter(db as any),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    plugins: [nextCookies()],
  });

  return authInstance;
}

// Se utiliza `await` a nivel superior (top-level await) para inicializar y exportar
// la instancia de `betterAuth` de forma asíncrona.
// Esto crea un singleton que se compartirá en todo el ámbito del servidor de la aplicación,
// asegurando que `getAuth` se ejecute solo una vez al iniciar el servidor.
export const auth = await getAuth();