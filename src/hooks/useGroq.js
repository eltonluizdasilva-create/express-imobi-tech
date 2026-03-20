import { useState } from 'react';

export function useGroq() {
    const [loading, setLoading] = useState(false);

    const analyzeText = async (prompt) => {
        setLoading(true);
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" },
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Erro na Groq");
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (err) {
            console.error("Erro Groq:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { analyzeText, loading };
}