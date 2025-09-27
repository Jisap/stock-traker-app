'use client'

import { useEffect, useRef } from "react"

/**
 * Hook personalizado para cargar y gestionar un widget de TradingView.
 * Este hook se encarga de inyectar dinámicamente el script de TradingView
 * y su configuración en un elemento del DOM, asegurando que el widget
 * se cargue una sola vez y se limpie correctamente al desmontar el componente.
 *
 * @param scriptUrl La URL del script principal de TradingView (ej. "https://s3.tradingview.com/tv.js").
 * @param config    Un objeto con la configuración específica del widget de TradingView
 *                  (ej. símbolo, tema, intervalo, etc.).
 * @param height    La altura en píxeles que tendrá el contenedor del widget. Por defecto es 600px.
 * @returns         Una referencia (`RefObject`) a un elemento HTMLDivElement. Esta referencia
 *                  debe ser asignada a un `div` en el JSX del componente que utiliza el hook.
 */
const useTradingViewWidget = (
  scriptUrl: string,
  config: Record<string, unknown>,
  height = 600
) => {

  // `containerRef` es una referencia a un elemento HTMLDivElement.
  // Se usará para "enganchar" el widget de TradingView a un div específico en el DOM.
  const containerRef = useRef<HTMLDivElement | null>(null);

  // `useEffect` se utiliza para manejar efectos secundarios, como la manipulación del DOM
  // y la carga de scripts externos, que deben ocurrir después del renderizado inicial.
  useEffect(() => {

    // Si la referencia al contenedor no está disponible (ej. el componente aún no se ha montado),
    // o si el widget ya ha sido cargado (indicado por `dataset.loaded`), salimos de la función
    // para evitar cargas duplicadas.
    if (!containerRef.current) return;
    if (containerRef.current.dataset.loaded) return;

    // Preparamos el HTML interno del contenedor. TradingView espera un div anidado
    // donde inyectará su contenido. Le damos un estilo inicial con el 100% de ancho
    // y la altura especificada.
    containerRef.current.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>`;

    const script = document.createElement("script"); // Creamos un script HTML interno
    script.src = scriptUrl;                          // Asignamos la URL del script principal
    script.async = true;                             // Marcamos el script como asíncrono
    script.innerHTML = JSON.stringify(config);       // Inyectamos la configuración del widget

    containerRef.current.appendChild(script);        // Añadimos el script al contenedor
    containerRef.current.dataset.loaded = 'true';    // Marcamos el contenedor como cargado


    return () => {
      if (containerRef.current) {                    // Si el contenedor existe,
        containerRef.current.innerHTML = '';         // limpiamos su contenido
        delete containerRef.current.dataset.loaded;  // y marcamos como no cargado

      }
    }
  }, [scriptUrl, config, height])

  return containerRef;
}

export default useTradingViewWidget