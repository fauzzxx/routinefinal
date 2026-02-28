/**
 * Reusable localStorage wrapper for RoutineAI persistence.
 * Ensures all keys are prefixed to avoid collisions.
 */
const PREFIX = 'rb_';

export const storage = {
    get: <T>(key: string, defaultValue: T): T => {
        try {
            const stored = localStorage.getItem(`${PREFIX}${key}`);
            return stored ? (JSON.parse(stored) as T) : defaultValue;
        } catch (e) {
            console.warn(`Error reading localStorage key "${key}":`, e);
            return defaultValue;
        }
    },

    set: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
        } catch (e) {
            console.error(`Error saving to localStorage key "${key}":`, e);
        }
    },

    remove: (key: string): void => {
        localStorage.removeItem(`${PREFIX}${key}`);
    },

    clear: (): void => {
        Object.keys(localStorage)
            .filter(k => k.startsWith(PREFIX))
            .forEach(k => localStorage.removeItem(k));
    }
};
