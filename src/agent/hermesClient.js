import OpenAI from "openai";

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
  dangerouslyAllowBrowser: true // Necessário para execução direta no frontend/browser se aplicável
});

// Chamada genérica reutilizável por qualquer agente
export async function executarAgenteHermes(promptSistema, historicoMensagens) {
  const response = await deepseek.chat.completions.create({
    model: "deepseek-chat", // V3 rápido e hiper-barato
    messages: [
      { role: "system", content: promptSistema },
      ...historicoMensagens,
    ],
    temperature: 0.3, // Respostas mais precisas e estruturadas
  });

  return response.choices[0].message.content;
}
