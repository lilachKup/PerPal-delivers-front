// ===== Driver Session Utils =====

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


export function requireDriverSessionOrRedirect() {
    const d = getDriverSession();
    if (!d) {
        window.location.href = "/login-driver"; 
        return null;
    }
    return d;
}

export function clearDriverSession() {
    localStorage.removeItem("pp_driver");
    sessionStorage.clear();
}
