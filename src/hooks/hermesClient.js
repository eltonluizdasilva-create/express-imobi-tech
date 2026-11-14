import OpenAI from "openai";

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || "",
  dangerouslyAllowBrowser: true // Obrigatório para execução direta no navegador
});

export async function executarAgenteHermes(promptSistema, historicoMensagens) {
  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: promptSistema },
        ...historicoMensagens,
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Erro na execução do Agente Hermes:", error);
    throw error;
  }
}