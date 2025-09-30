import Header from "@/components/Header"
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
 
/**
 * Layout principal para las rutas protegidas de la aplicación (agrupadas en `(root)`).
 * Este es un Componente de Servidor que se ejecuta en cada petición a una ruta protegida.
 * Su función principal es actuar como un guardián de rutas, asegurando que solo
 * los usuarios autenticados puedan acceder al contenido.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {React.ReactNode} props.children - Los componentes hijos (la página actual) que serán renderizados si el usuario está autenticado.
 */
const Layout = async ({ children }: { children: React.ReactNode }) => {
 
  // 1. Obtener la sesión del usuario en el servidor.
  // `auth.api.getSession` es una función de `better-auth` que lee la cookie de sesión.
  // `headers()` de `next/headers` proporciona las cabeceras de la solicitud HTTP actual,
  // que son necesarias para que `getSession` pueda encontrar y validar la cookie.
  const session = await auth.api.getSession({ headers: await headers() });
 
  // 2. Proteger la ruta.
  // Si `session` es nulo o no contiene un objeto `user`, significa que el usuario no está autenticado.
  // `redirect()` de `next/navigation` interrumpe el renderizado y envía al usuario a la página de inicio de sesión.
  if (!session?.user) redirect('/sign-in');
 
  // 3. Preparar los datos del usuario para pasarlos a los componentes hijos.
  // Se crea un objeto `user` con la información esencial para evitar pasar datos innecesarios.
  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  }
 
  return (
    <main className="min-h-screen text-gray-400">
      {/* Header */}
      {/* Se renderiza el encabezado de la aplicación, pasando los datos del usuario. */}
      <Header user={user} />
      <div className="container py-10">
        {children}
      </div>
    </main>
  )
}

export default Layout