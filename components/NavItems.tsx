"use client"

import { NAV_ITEMS } from '@/lib/constants'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import SearchCommand from './SearchCommand'

const NavItems = () => {

  const pathname = usePathname(); // Obtiene la ruta actual de la URL

  /**
   * Determina si un enlace de navegación está activo basándose en el pathname actual de la URL.
   * Maneja el caso especial de la ruta raíz ('/') para asegurar que solo esté activa cuando la URL es exactamente '/'.
   */
  const isActive = (path: string) => {              // Recive un link de navegación
    if (path === '/') return pathname === '/';      // Si el link es la ruta raíz la funcion devuelve true si la URL es exactamente '/' (Link es active si url es '/')

    return pathname.startsWith(path);               // Para cualquier otro link de navegación, se compara si la URL comienza con el path proporcionado -> true (Link es active si url comienza con el path)
  }

  return (
    <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
      {NAV_ITEMS.map(({ href, label }) => {
        if (href === '/search') return (
          <li key="search-trigger">
            {/* SearchCommand */}
            <SearchCommand 
              renderAs='text'
              label="Search"
              initialStocks={[]}
            />
          </li>
        )

        return <li key={href}>
          <Link href={href} className={`hover:text-yellow-500 transition-colors ${isActive(href) ? 'text-gray-100' : ''
            }`}>
            {label}
          </Link>
        </li>
      })}
    </ul>
  )
}

export default NavItems