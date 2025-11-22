// Aze Study Buddy AI Service - Simple Version
// Basic AI chat for study tips and motivation

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "";

export interface ChatMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

// Simple system prompt focused on study assistance
const SYSTEM_PROMPT = `You are Aze, a friendly AI study buddy. You help students with:

- Study tips and techniques
- Time management advice
- Motivation and encouragement
- Breaking down complex topics
- Productivity strategies

Keep responses concise (2-3 sentences), supportive, and actionable. Be encouraging and maintain a friendly tone!`;

/**
 * Get AI chat response from OpenRouter using Grok
 */
export async function getChatResponse(
    message: string,
    chatHistory: ChatMessage[] = []
): Promise<string> {
    try {
        // Prepare messages for API
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...chatHistory.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: "user", content: message }
        ];

        // Call OpenRouter API
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.origin,
                "X-Title": "Aze Study Buddy",
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b:free",
                max_tokens: 500,
                messages
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error: any) {
        console.error("Aze chat error:", error);
        throw new Error(error.message || "Failed to get response from Aze");
    }
}
