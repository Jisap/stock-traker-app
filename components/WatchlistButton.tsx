"use client";

import React from "react";

// WatchlistButton es un botón reutilizable diseñado para que los usuarios puedan 
// agregar o quitar una acción (stock) de su lista de seguimiento (watchlist)


const WatchlistButton = ({
  symbol,
  company, // No se usa actualmente, pero se mantiene para posible uso futuro
  isInWatchlist, // Por defecto es false
  showTrashIcon = false,
  type = "button",
  onWatchlistChange, // action para actualizar el estado del watchlist
}: WatchlistButtonProps) => {

  const label = type === "icon" ? "" : (isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist");

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { // Cuando se hace click
    e.stopPropagation();                // Evita que el evento se propague al Link padre.
    const next = !isInWatchlist;        // Se invierte el estado actual.
    onWatchlistChange?.(symbol, next);  // Notifica al componente padre del cambio.
  };

  if (type === "icon") {
    return (
      <button
        title={isInWatchlist ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        aria-label={isInWatchlist ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        className={`watchlist-icon-btn ${isInWatchlist ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isInWatchlist ? "#FACC15" : "none"}
          stroke="#FACC15"
          strokeWidth="1.5"
          className="watchlist-star h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button className={`watchlist-btn ${isInWatchlist ? "watchlist-remove" : ""}`} onClick={handleClick}>
      {showTrashIcon && isInWatchlist ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
        </svg>
      ) : null}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;