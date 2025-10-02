import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina y fusiona clases de CSS de forma segura, resolviendo conflictos de Tailwind CSS.
 * @param {...ClassValue[]} inputs - Una lista de clases de CSS para combinar.
 * @returns {string} Una cadena de clases de CSS optimizada.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte un timestamp de Unix a una cadena de tiempo relativo (ej. "hace 5 minutos").
 * @param {number} timestamp - El timestamp en segundos.
 * @returns {string} La cadena de tiempo formateada.
 */
export const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diffInMs = now - timestamp * 1000; // Convert to milliseconds
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInHours > 24) {
    const days = Math.floor(diffInHours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInHours >= 1) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
};

/**
 * Crea una pausa o espera durante un número determinado de milisegundos.
 * @param {number} ms - El número de milisegundos a esperar.
 * @returns {Promise<void>} Una promesa que se resuelve después del retraso.
 */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Formatea un número de capitalización de mercado a una cadena legible (ej. "$1.5T", "$250B", "$10M").
 * @param {number} marketCapUsd - El valor numérico de la capitalización de mercado.
 * @returns {string} La cadena formateada o 'N/A' si el valor no es válido.
 */
// Formatted string like "$3.10T", "$900.00B", "$25.00M" or "$999,999.99"
export function formatMarketCapValue(marketCapUsd: number): string {
  if (!Number.isFinite(marketCapUsd) || marketCapUsd <= 0) return 'N/A';

  if (marketCapUsd >= 1e12) return `$${(marketCapUsd / 1e12).toFixed(2)}T`; // Trillions
  if (marketCapUsd >= 1e9) return `$${(marketCapUsd / 1e9).toFixed(2)}B`; // Billions
  if (marketCapUsd >= 1e6) return `$${(marketCapUsd / 1e6).toFixed(2)}M`; // Millions
  return `$${marketCapUsd.toFixed(2)}`; // Below one million, show full USD amount
}

/**
 * Obtiene un rango de fechas desde `days` días atrás hasta hoy.
 * @param {number} days - El número de días hacia atrás desde hoy.
 * @returns {{ to: string, from: string }} Un objeto con las fechas de inicio y fin en formato 'YYYY-MM-DD'.
 */
export const getDateRange = (days: number) => {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - days);
  return {
    to: toDate.toISOString().split('T')[0],
    from: fromDate.toISOString().split('T')[0],
  };
};

/**
 * Obtiene un rango de fechas que solo incluye el día de hoy.
 * @returns {{ to: string, from: string }} Un objeto donde 'to' y 'from' son la fecha de hoy.
 */
export const getTodayDateRange = () => {
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  return {
    to: todayString,
    from: todayString,
  };
};

/**
 * Calcula cuántas noticias obtener por símbolo, basado en el tamaño de la watchlist.
 * @param {number} symbolsCount - El número de símbolos en la watchlist.
 * @returns {{ itemsPerSymbol: number, targetNewsCount: number }} El número de noticias por símbolo y el total objetivo.
 */
export const calculateNewsDistribution = (symbolsCount: number) => {
  let itemsPerSymbol: number;
  let targetNewsCount = 6;

  if (symbolsCount < 3) {
    itemsPerSymbol = 3; // Fewer symbols, more news each
  } else if (symbolsCount === 3) {
    itemsPerSymbol = 2; // Exactly 3 symbols, 2 news each = 6 total
  } else {
    itemsPerSymbol = 1; // Many symbols, 1 news each
    targetNewsCount = 6; // Don't exceed 6 total
  }

  return { itemsPerSymbol, targetNewsCount };
};

/**
 * Valida que un artículo de noticias sin procesar tenga los campos esenciales.
 * @param {RawNewsArticle} article - El objeto del artículo.
 * @returns {boolean} `true` si el artículo es válido, de lo contrario `false`.
 */
export const validateArticle = (article: RawNewsArticle) =>
  article.headline && article.summary && article.url && article.datetime;

/**
 * Obtiene la fecha de hoy como una cadena en formato 'YYYY-MM-DD'.
 * @returns {string} La fecha de hoy.
 */
export const getTodayString = () => new Date().toISOString().split('T')[0];

/**
 * Formatea un artículo de noticias sin procesar a un objeto `MarketNewsArticle` estructurado.
 * @param {RawNewsArticle} article - El artículo original.
 * @param {boolean} isCompanyNews - Indica si es una noticia de empresa o general.
 * @param {string} [symbol] - El símbolo del activo si es una noticia de empresa.
 * @param {number} [index=0] - Un índice para ayudar a generar un ID único.
 * @returns {MarketNewsArticle} El artículo formateado.
 */
export const formatArticle = (
  article: RawNewsArticle,
  isCompanyNews: boolean,
  symbol?: string,
  index: number = 0
) => ({
  id: isCompanyNews ? Date.now() + Math.random() : article.id + index,
  headline: article.headline!.trim(),
  summary:
    article.summary!.trim().substring(0, isCompanyNews ? 200 : 150) + '...',
  source: article.source || (isCompanyNews ? 'Company News' : 'Market News'),
  url: article.url!,
  datetime: article.datetime!,
  image: article.image || '',
  category: isCompanyNews ? 'company' : article.category || 'general',
  related: isCompanyNews ? symbol! : article.related || '',
});

export const formatChangePercent = (changePercent?: number) => {
  if (!changePercent) return '';
  const sign = changePercent > 0 ? '+' : '';
  return `${sign}${changePercent.toFixed(2)}%`;
};

export const getChangeColorClass = (changePercent?: number) => {
  if (!changePercent) return 'text-gray-400';
  return changePercent > 0 ? 'text-green-500' : 'text-red-500';
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
};

export const formatDateToday = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});


export const getAlertText = (alert: Alert) => {
  const condition = alert.alertType === 'upper' ? '>' : '<';
  return `Price ${condition} ${formatPrice(alert.threshold)}`;
};

export const getFormattedTodayDate = () => new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});
