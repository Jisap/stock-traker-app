"use client";

import { useState } from "react";


import { updateWatchlist } from "@/lib/actions/watchlist.actions";

import WatchlistTable from "./WatchlistTable";
import WatchlistEmpty from "./WatchlistEmpty";
import WatchlistNews from "@/app/(root)/watchlist/WatchlistNews";

interface WatchlistProps {
  initialWatchlist: WatchlistItem[];
  news: MarketNewsArticle[];
}

/**
 * Componente principal para la página de Watchlist.
 * Maneja el estado de la lista y las acciones del usuario.
 */
const Watchlist = ({ initialWatchlist, news }: WatchlistProps) => {
  const [watchlist, setWatchlist] = useState(initialWatchlist);

  /**
   * Maneja la eliminación de un item de la watchlist.
   * Llama a la Server Action y actualiza el estado local para reflejar el cambio en la UI.
   */
  const handleRemove = async (symbol: string) => {
    // Llama a la Server Action para eliminarlo de la DB.
    await updateWatchlist(symbol, false);

    // Actualiza el estado local para quitar el item de la tabla instantáneamente.
    setWatchlist((current) => current.filter((item) => item.symbol !== symbol));
  };

  // Si la watchlist está vacía, muestra un mensaje.
  if (watchlist.length === 0) {
    return <WatchlistEmpty />;
  }

  // Si hay items, muestra la tabla.
  return (
    <div className="watchlist-container">
      {/* Columna principal con la tabla */}
      <div className="watchlist">
        <h1 className="watchlist-title">My Watchlist</h1>
        <WatchlistTable watchlist={watchlist} onRemove={handleRemove} />
      </div>

      {/* Columna lateral con el widget de noticias */}
      <WatchlistNews news={news} />
    </div>
  );
};

export default Watchlist;