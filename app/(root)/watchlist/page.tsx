

import Watchlist from "@/components/Watchlist";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getWatchlistByEmail, getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getSession } from "@/lib/better-auth/auth";
import { headers } from "next/headers";


/**
 * Página para mostrar la lista de seguimiento (watchlist) del usuario.
 * Es un Server Component que obtiene los datos necesarios del servidor.
 */
export default async function WatchlistPage() {

  
  const session = await getSession({ headers: await headers() });           // 1. Obtener la sesión del usuario.
  const user = session?.user;

  
  if (!user?.email) {
    return <div>Please log in to see your watchlist.</div>;                 // 2. Si no hay usuario, no se puede mostrar nada.
  }

  
  const initialWatchlist = await getWatchlistByEmail(user.email);           // 3. Obtener los items de la watchlist desde la base de datos.
  
  
  const symbols = initialWatchlist.map(item => item.symbol);                // 4. Obtener los símbolos para buscar noticias.
  const news = await getNews(symbols);

  
  return (                                                                  // 5. Renderizar el componente principal, pasándole la watchlist y las noticias.
    <Watchlist 
      initialWatchlist={initialWatchlist} 
      news={news} 
    />
  );
}