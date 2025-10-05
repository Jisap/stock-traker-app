"use client";

import SearchCommand from "@/components/SearchCommand";
import { Star } from "lucide-react";


/**
 * Componente que se muestra cuando la watchlist del usuario está vacía.
 */
const WatchlistEmpty = () => {
  return (
    <div className="watchlist-empty-container">
      <div className="watchlist-empty">
        <div className="watchlist-icon">
          <Star className="watchlist-star" />
        </div>
        <h2 className="empty-title">Your watchlist is empty</h2>
        <p className="empty-description">
          Add stocks to your watchlist to track their performance.
        </p>
        <SearchCommand label="Add Stock" initialStocks={[]} />
      </div>
    </div>
  );
};

export default WatchlistEmpty;