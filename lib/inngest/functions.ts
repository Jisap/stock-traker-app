import { sendWelcomeEmail } from "../nodemailer"
import { inngest } from "./client"
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./propmpts"


export const sendSignUpEmail = inngest.createFunction(
  { id: 'sign-up-email' },                                          // Identificador único de la función
  { event: 'app/user.created' },                                    // Evento que desencadena la función
  async ({ event, step }) => {                                      // Función que se ejecuta cuando el evento se produce (event: datos del nuevo usuario y formulario, step: objeto de inngest que permite ejecutar distintas acciones))
    // Datos del usuario
    const userProfile = `                                                 
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile) // Prompt personalizado con los datos del usuario

    const response = await step.ai.infer('generate-welcome-intro', {                         // 1er paso: Se llama al modelo de IA para generar el mensaje de bienvenida
      model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
      body: {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt }
            ]
          }]
      }
    })

    await step.run('send-welcome-email', async () => {                                     // 2º paso: Se envía el mensaje de bienvenida por correo electrónico
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText = (part && 'text' in part ? part.text : null) || 'Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.'

      const { data: { email, name } } = event;

      return await sendWelcomeEmail({ email, name, intro: introText });
    })

    return {
      success: true,
      message: 'Welcome email sent successfully'
    }
  }
)