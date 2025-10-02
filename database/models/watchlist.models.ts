import { Schema, model, models, type Document, type Model } from 'mongoose';

/**
 * 1. Interfaz de TypeScript: Define la forma de un item de la watchlist para
 *    proporcionar autocompletado y seguridad de tipos en el código.
 */
export interface WatchlistItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}
/**
 * 2. Esquema de Mongoose: Define la estructura y las reglas de los datos
 *    que se almacenarán en la colección 'watchlists' de MongoDB.
 */
const WatchlistSchema = new Schema<WatchlistItem>(
  { 
    userId: { type: String, required: true, index: true },                 // ID del usuario al que pertenece el item. Requerido e indexado para búsquedas rápidas.
    symbol: { type: String, required: true, uppercase: true, trim: true }, // Símbolo del activo (ej. 'AAPL'). Requerido, se guarda en mayúsculas y sin espacios.
    company: { type: String, required: true, trim: true },                 // Nombre de la compañía. Requerido y sin espacios extra.
    addedAt: { type: Date, default: Date.now },                            // Fecha en que se añadió, con la fecha actual como valor por defecto.
  },
  { timestamps: false }                                                    // Deshabilita los timestamps automáticos (`createdAt`, `updatedAt`) de Mongoose.
);

/**
 * 3. Índice Compuesto Único: Regla CRÍTICA a nivel de base de datos.
 *    Asegura que un usuario no pueda añadir el mismo símbolo (`symbol`) a su
 *    lista de seguimiento (`userId`) más de una vez.
 */
WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

/**
 * 4. Exportación del Modelo:
 *    Utiliza un patrón estándar en Next.js para evitar recompilar el modelo en cada
 *    recarga durante el desarrollo. Si el modelo 'Watchlist' ya existe, lo reutiliza;
 *    si no, lo crea a partir del esquema.
 */
export const Watchlist: Model<WatchlistItem> =
  (models?.Watchlist as Model<WatchlistItem>) || model<WatchlistItem>('Watchlist', WatchlistSchema);

