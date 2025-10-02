import { getNews } from "../actions/finnhub.actions";
import { getAllUsersForNewsEmail } from "../actions/user.actions";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "../nodemailer"
import { getFormattedTodayDate } from "../utils";
import { inngest } from "./client"
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./propmpts"


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
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: 'daily-news-summary' },                                                  // Identificador único para la función.
  [{ event: 'app/send.daily.news' }, { cron: '0 12 * * *' }],                    // Se activa por un evento o diariamente a las 12:00 PM.
  async ({ step }) => {
    
    const users = await step.run('get-all-users', getAllUsersForNewsEmail)                                   // Paso 1: Obtener todos los usuarios que deben recibir el correo de noticias. 

    if (!users || users.length === 0) return { success: false, message: 'No users found for news email' };   // Si no hay usuarios, la función termina temprano.
 
    const results = await step.run('fetch-user-news', async () => {                                          // Paso 2: Para cada usuario, obtener noticias personalizadas basadas en su watchlist.
      
      const perUser: Array<{                                                                                 // Definición de la estructura de datos devuelta por la función.
        user: UserForNewsEmail; 
        articles: MarketNewsArticle[] 
      }> = [];
      
      for (const user of users as UserForNewsEmail[]) {
        try {
          
          const symbols = await getWatchlistSymbolsByEmail(user.email);                                       // Obtiene los símbolos de la watchlist del usuario.
          
          let articles = await getNews(symbols);                                                              // Busca noticias para esos símbolos.
          
          articles = (articles || []).slice(0, 6);                                                            // Limita a un máximo de 6 artículos por usuario.  
          
          if (!articles || articles.length === 0) {                                                           // Si no hay noticias personalizadas, busca noticias generales como fallback.
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          
          perUser.push({ user, articles });                                                                   // Almacena las noticias junto con la información del usuario.
        } catch (e) {
          
          console.error('daily-news: error preparing user news', user.email, e);                              // Si hay un error para un usuario, se registra y se continúa con los demás.
          perUser.push({ user, articles: [] });
        }
      }
      
      return perUser;                                                                                         // Devuelve un array con los datos de noticias para cada usuario.
    });

    
    const userNewsSummaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];                   // Paso 3: Usar IA para generar un resumen en HTML para las noticias de cada usuario.

    for (const { user, articles } of results) {
      try {   
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));  // Prepara el prompt reemplazando el placeholder con los artículos del usuario.
 
        const response = await step.ai.infer(`summarize-news-${user.email}`, {                                // Llama al modelo de IA (Gemini) para generar el contenido HTML del correo. 
          model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
          body: {
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          }
        });
             
        const part = response.candidates?.[0]?.content?.parts?.[0];                                           // Extrae el contenido generado por la IA, con un texto de fallback si falla.
        const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.'

        userNewsSummaries.push({ user, newsContent });
      } catch (e) {
        
        console.error('Failed to summarize news for : ', user.email);                                         // Si la IA falla para un usuario, se registra y se asigna un contenido nulo.
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    
    await step.run('send-news-emails', async () => {                                                          // Paso 4: Enviar los correos electrónicos generados a cada usuario.
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;
          
          return await sendNewsSummaryEmail({ email: user.email, date: getFormattedTodayDate(), newsContent })// Llama a la función que envía el correo con los datos correspondientes.
        })
      )
    })

    return { success: true, message: 'Daily news summary emails sent successfully' }
  }
)