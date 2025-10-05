"use client"

import { useEffect, useState } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";

import { useDebounce } from "@/hooks/useDebounce";
import WatchlistButton from "./WatchlistButton";
import { updateWatchlist } from "@/lib/actions/watchlist.actions";
import { searchStocks } from "@/lib/actions/finnhub.actions";


export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) {

  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Este es el useEffect se ejecuta cuando el diálogo se abre.
  useEffect(() => {
    // Si el diálogo está abierto y no hay término de búsqueda...
    if (open && !searchTerm) {
      const fetchPopular = async () => {
        setLoading(true);
        try {
          // Llama a searchStocks sin 'query' para obtener las acciones populares.
          const results = await searchStocks();
          setStocks(results);
        } catch {
          setStocks([]);
        } finally {
          setLoading(false);
        }
      };
      fetchPopular();
    }
  }, [open]); // Se ejecuta solo cuando el estado 'open' cambia.

  const handleSearch = async () => {
    if (!isSearchMode) return setStocks(initialStocks);

    setLoading(true)
    try {
      const results = await searchStocks(searchTerm.trim());
      setStocks(results);
    } catch {
      setStocks([])
    } finally {
      setLoading(false)
    }
  }

  // Debounce para evitar buscar demasiadas veces al mismo tiempo.
  const debouncedSearch = useDebounce(handleSearch, 300); 

  useEffect(() => {
    // Ahora este useEffect solo se encarga de buscar cuando el usuario escribe.
    if (searchTerm.trim()) {
      debouncedSearch();
    }
  }, [searchTerm]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
  }

  const handleWatchlistChange = async (symbol: string, isAdding: boolean) => {
    // 1. Actualización optimista de la UI: Cambia el estado local al instante.
    setStocks(currentStocks =>                      
      currentStocks.map(stock =>                    // Se itera sobre los objetos de la lista de acciones.
        stock.symbol === symbol                     // Si el símbolo coincide con el actual...
          ? { ...stock, isInWatchlist: isAdding }   // Se actualiza el estado local.
          : stock                                   // De lo contrario, se mantiene el mismo objeto.
      )
    );

    // 2. Llamada a la Server Action para persistir el cambio en la BBDD.
    const result = await updateWatchlist(symbol, isAdding);   

    // 3. Si falla, revierte el cambio en la UI para mantener la consistencia.
    if (!result.success) {
      setStocks(currentStocks => 
        currentStocks.map(stock => 
          stock.symbol === symbol 
            ? { ...stock, isInWatchlist: !isAdding } 
            : stock
        )
      );
    }
  };

  return (
    <>
      {renderAs === 'text' ? (
        <span onClick={() => setOpen(true)} className="search-text">
          {label}
        </span>
      ) : (
        <Button onClick={() => setOpen(true)} className="search-btn">
          {label}
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
        <div className="search-field">
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Search stocks..."
            className="search-input"
          />
          {loading && <Loader2 className="search-loader" />}
        </div>

        <CommandList className="search-list">
          {loading ? 
            (
              <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
            ) : displayStocks?.length === 0 ? (
                <div className="search-list-indicator">
                  {isSearchMode ? 'No results found' : 'No stocks available'}
                </div>
              ) : (
                <ul>
                  <div className="search-count">
                    {isSearchMode ? 'Search results' : 'Popular stocks'}
                    {` `}({displayStocks?.length || 0})
                  </div>

                  {displayStocks?.map((stock, i) => (
                    <li key={stock.symbol} className="search-item">
                      <Link
                        href={`/stocks/${stock.symbol}`}
                        onClick={handleSelectStock}
                        className="search-item-link"
                      >
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <div className="search-item-name">
                            {stock.name}
                          </div>

                          <div className="text-sm text-gray-500">
                            {stock.symbol} | {stock.exchange} | {stock.type}
                          </div>
                        </div>

                        <WatchlistButton
                          symbol={stock.symbol}
                          company={stock.name}
                          isInWatchlist={stock.isInWatchlist}
                          type="icon"
                          onWatchlistChange={handleWatchlistChange} // Action para actualizar el estado del watchlist desde una función optimista
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
          )
          }
        </CommandList>
      </CommandDialog>
    </>
  )
}