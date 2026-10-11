const KEY = "radiantxai.session";
export function loadSession() {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
export function saveSession(session) {
    try {
        localStorage.setItem(KEY, JSON.stringify(session));
    }
    catch {
        // storage unavailable: the session just won't survive a refresh
    }
}
export function clearSession() {
    try {
        localStorage.removeItem(KEY);
    }
    catch {
        // ignore
    }
}
