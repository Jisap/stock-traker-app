import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Función middleware de Next.js.
 * Se ejecuta para cada solicitud que coincide con el `matcher` definido en `config`.
 * Su objetivo principal es verificar la autenticación del usuario.
 *
 * @param {NextRequest} request - El objeto de solicitud entrante.
 * @returns {NextResponse} Una respuesta de Next.js (redirección o continuación).
 */


export async function middleware(request: NextRequest) {
  // Intenta obtener la cookie de sesión del usuario de la solicitud.
  // `getSessionCookie` de `better-auth/cookies` se encarga de leer la cookie
  // que indica si hay una sesión activa.
  const sessionCookie = getSessionCookie(request);

  // Si no se encuentra una cookie de sesión (el usuario no está autenticado),
  // redirige al usuario a la página de inicio ("/").
  // `NextResponse.redirect` crea una respuesta de redirección.
  // `new URL("/", request.url)` construye la URL absoluta de la raíz del sitio.
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Si se encuentra una cookie de sesión (el usuario está autenticado),
  // permite que la solicitud continúe a la ruta original.
  return NextResponse.next();
}

export const config = {
  // El `matcher` define qué rutas deben pasar por este middleware.
  // La expresión regular excluye rutas como APIs, archivos estáticos, imágenes,
  // y las páginas de inicio de sesión/registro, aplicando el middleware a todas las demás.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|assets).*)',
  ],
};