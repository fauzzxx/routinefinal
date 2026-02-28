/**
 * Lightweight Gemini API client using native fetch.
 * Powers the Social Story Generator and AI Therapist Assistant.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function askGemini(prompt: string): Promise<string> {
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY not found in .env");
    }

    const response = await fetch(`${MODEL_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            }
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Failed to communicate with Gemini");
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Helper to clean up JSON responses from Gemini (removes markdown backticks).
 */
export function cleanJsonResponse(raw: string): string {
    return raw.replace(/```json/g, "").replace(/```/g, "").trim();
}
