import Header from "@/components/Header"
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Layout principal para las rutas protegidas de la aplicación (grupo `(root)`).
 * Este componente de servidor se encarga de:
 * 1. Verificar la sesión del usuario.
 * 2. Redirigir a los usuarios no autenticados a la página de inicio de sesión.
 * 3. Renderizar el `Header` y el contenido de la página (`children`) para usuarios autenticados.
 */
const Layout = async({ children}: {children: React.ReactNode}) => {

  // Obtenemos la sesión del usuario del lado del servidor.
  // `auth.api.getSession` necesita las cabeceras de la petición para leer la cookie de sesión.
  const session = await auth.api.getSession({ headers: await headers() });

  // Si no hay una sesión de usuario válida, redirigimos a la página de inicio de sesión.
  // Esto protege todas las rutas anidadas dentro de este layout.
  if (!session?.user) redirect('/sign-in');

  return (
    <main className="min-h-screen text-gray-400">
      {/* Header */}
      {/* Pasamos directamente el objeto `session.user` al Header. */}
      <Header user={session.user} />
      <div className="container py-10">
        {children}
      </div>
    </main>
  )
}

export default Layout