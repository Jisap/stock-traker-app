'use server';

import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";

/**
 * Registra un nuevo usuario con su email y contraseña.
 * Después del registro exitoso, envía un evento a Inngest para manejar
 * tareas asíncronas en segundo plano, como enviar un email de bienvenida.
 */
export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
  try {
    // Llama a la API de better-auth para crear el usuario en la base de datos.
    const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

    // Si el registro fue exitoso, envía un evento a Inngest.
    // La palabra clave `await` aquí solo espera la confirmación de que Inngest recibió el evento.
    // La ejecución de la función asociada (enviar el email) ocurre de forma asíncrona.
    if (response) {
      await inngest.send({
        name: 'app/user.created',
        data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
      })
    }
    
    // Retorna éxito al cliente. La experiencia de usuario es rápida porque no esperamos a que se envíe el email.
    return { success: true, data: response }
  } catch (e) {
    console.log('Sign up failed', e)
    return { success: false, error: 'Sign up failed' }
  }
}

/**
 * Inicia la sesión de un usuario existente usando su email y contraseña.
 */
export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
    const response = await auth.api.signInEmail({ body: { email, password } })

    return { success: true, data: response }
  } catch (e) {
    console.log('Sign in failed', e)
    return { success: false, error: 'Sign in failed' }
  }
}

/**
 * Cierra la sesión del usuario actual.
 */
export const signOut = async () => {
  try {
    // Llama a la API de better-auth para cerrar la sesión.
    // Se pasan las cabeceras (`headers`) para que la librería pueda leer y eliminar las cookies de sesión.
    await auth.api.signOut({ headers: await headers() });
  } catch (e) {
    console.log('Sign out failed', e)
    return { success: false, error: 'Sign out failed' }
  }
}