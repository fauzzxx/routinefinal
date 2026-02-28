/**
 * Utility for browser-based text-to-speech.
 * Configured with a calm, child-friendly rate and pitch.
 */
export const speak = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Settings for autism-friendly communication:
    // - Slower rate (0.8 - 0.9)
    // - Slightly higher pitch for a friendly tone
    utterance.rate = 0.85;
    utterance.pitch = 1.1;

    if (onEnd) {
        utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};
