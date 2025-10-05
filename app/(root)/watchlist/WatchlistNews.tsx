"use client";

import { formatTimeAgo } from "@/lib/utils";
import Link from "next/link";

/**
 * Componente para mostrar una lista de noticias del mercado.
 * Ocupa la columna lateral en la página de la Watchlist.
 */
const WatchlistNews = ({ news }: WatchlistNewsProps) => {
  if (!news || news.length === 0) {
    return null; // No renderiza nada si no hay noticias
  }

  return (
    <aside className="watchlist-alerts">
      <h2 className="watchlist-title mb-8">Market News</h2>
      <div className="flex flex-col gap-4">
        {news.map((article) => (
          <Link
            href={article.url}
            key={article.id}
            target="_blank"
            rel="noopener noreferrer"
            className="news-item"
          >
            <span className="news-tag">{article.source}</span>
            <h3 className="news-title">{article.headline}</h3>
            <div className="news-meta">
              <span>{formatTimeAgo(article.datetime)}</span>
            </div>
            <p className="news-summary">{article.summary}</p>
          </Link>
        ))}
      </div>
    </aside>
  );
};

export default WatchlistNews;