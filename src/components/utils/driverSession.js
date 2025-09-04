// ===== Driver Session Utils =====

// שמירת סשן שליח אחרי לוגין

export function setDriverSession({ firstName, lastName }) {
    localStorage.setItem("pp_driver", JSON.stringify({ firstName, lastName }));
}
export function getDriverSession() {
    try {
        const raw = localStorage.getItem("pp_driver");
        if (!raw) return null;
        return JSON.parse(raw);
    } catch { return null; }
}
// חובה להתחבר – אחרת רידיירקט ללוגין
export function requireDriverSessionOrRedirect() {
    const d = getDriverSession();
    if (!d) {
        window.location.href = "/login-driver"; // שנה לנתיב שלך אם שונה
        return null;
    }
    return d;
}

// ניקוי סשן (ל־Logout)
export function clearDriverSession() {
    localStorage.removeItem("pp_driver");
    sessionStorage.clear();
}
