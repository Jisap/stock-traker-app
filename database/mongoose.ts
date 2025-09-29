import mongoose from 'mongoose';


//const MONGODB_URI = process.env.MONGODB_URI;               // Obtiene la cadena de conexión de MongoDB desde las variables de entorno.                        

declare global {                                           // Extiende la interfaz global de NodeJS para incluir nuestra caché de mongoose.
  var mongooseCache: {                                     // Esto es para que TypeScript no se queje de una propiedad en el objeto global.
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  }
}

// Busca la caché existente en el objeto global o la crea si no existe.
// Este objeto persistirá entre las invocaciones de funciones en un entorno serverless.
let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Función asíncrona para conectar a la base de datos.
 * Reutiliza la conexión existente si ya está establecida.
 */
export const connectToDatabase = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;               // Obtiene la cadena de conexión de MongoDB desde las variables de entorno.

  if (!MONGODB_URI) throw new Error('MONGODB_URI must be set within .env');    // Si no se ha definido la URI de MongoDB, lanza un error.

  if (cached.conn) return cached.conn;                                         // Si ya hay una conexión en caché, la retorna inmediatamente.  

  if (!cached.promise) {                                                       // Si no hay promesa, crea una nueva.
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false }); // `bufferCommands: false` es una buena práctica para evitar que Mongoose
  }                                                                            // guarde operaciones en memoria si la conexión se pierde.


  try {                                                                        // Si no hay una conexión, pero ya se está procesando una promesa de conexión, la espera y la retorna. Esto evita conexiones concurrentes.
    cached.conn = await cached.promise;                                        // Espera a que la promesa de conexión se resuelva.
  } catch (err) {
    cached.promise = null;                                                     // Si la conexión falla, resetea la promesa y lanza el error.
    throw err;
  }


  //console.log(`Connected to database ${process.env.NODE_ENV} - ${MONGODB_URI}`);  // Mensaje de éxito para depuración.
  console.log(`Connected to database ${process.env.NODE_ENV}`);               // Mensaje de éxito para depuración.


  return cached.conn;                                                         // Retorna la conexión establecida.
}