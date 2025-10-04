// d:\React-Utilidades\next15-stocktracker\hooks\useDebounce.ts

'use client'; // Indica que este código se ejecuta en el navegador.

import { useCallback, useRef } from 'react';

/**
 * Hook personalizado que implementa la técnica de "debounce".
 *
 * @param callback La función que quieres ejecutar después del retraso.
 * @param delay    El tiempo en milisegundos que se debe esperar antes de ejecutar el callback.
 * @returns        Una nueva función que puedes llamar. Cada vez que la llamas, se reinicia el temporizador.
 */

export function useDebounce(callback: () => void, delay: number) {

  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);                    // 1. `useRef` para guardar el ID del temporizador.

  
  return useCallback(() => {                                                 // 2. `useCallback` para crear y memorizar la función "debounced".
    
    if (timeoutRef.current) {                                                // 3. Limpiar el temporizador anterior.   
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(callback, delay);                        // 4. Crear un nuevo temporizador.

  }, [callback, delay]); // Dependencias del useCallback
}
