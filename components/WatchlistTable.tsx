"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";
import { formatChangePercent, formatPrice, getChangeColorClass } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface WatchlistTableProps {
  watchlist: WatchlistItem[];
  onRemove: (symbol: string) => void;
}

/**
 * Muestra los items de la watchlist en una tabla.
 */
const WatchlistTable = ({ watchlist, onRemove }: WatchlistTableProps) => {
  const router = useRouter();

  return (
    <Table className="watchlist-table">
      <TableHeader>
        <TableRow className="table-header-row">
          {WATCHLIST_TABLE_HEADER.map((header) => (
            <TableHead key={header} className="table-header">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {watchlist.map((item) => (
          <TableRow
            key={item.symbol}
            className="table-row"
            onClick={() => router.push(`/stocks/${item.symbol}`)}
          >
            <TableCell className="table-cell font-bold">{item.company}</TableCell>
            <TableCell className="table-cell">{item.symbol}</TableCell>
            <TableCell className="table-cell">{formatPrice(item.price)}</TableCell>
            <TableCell className={`table-cell ${getChangeColorClass(item.change)}`}>
              {item.change?.toFixed(2)} ({formatChangePercent(item.changePercent)})
            </TableCell>
            <TableCell className="table-cell">N/A</TableCell>
            <TableCell className="table-cell">N/A</TableCell>
            <TableCell className="table-cell">
              {/* Placeholder for alert button */}
            </TableCell>
            <TableCell className="table-cell">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Evita que el clic navegue a la página de detalles
                  onRemove(item.symbol);
                }}
                className="p-2 rounded-full hover:bg-red-500/20"
                aria-label={`Remove ${item.symbol} from watchlist`}
              >
                <Trash2 className="trash-icon" />
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default WatchlistTable;