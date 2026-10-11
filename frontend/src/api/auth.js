import { API_BASE_URL, ApiError } from "./client";
async function readDetail(response) {
    try {
        const body = await response.json();
        if (typeof body?.detail === "string")
            return body.detail;
        if (Array.isArray(body?.detail) && typeof body.detail[0]?.msg === "string") {
            return body.detail[0].msg; // FastAPI validation errors
        }
    }
    catch {
        // body wasn't JSON
    }
    return `Request failed with status ${response.status}.`;
}
async function postAuth(path, body) {
    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    }
    catch {
        throw new ApiError("Could not reach the server. Check that the backend is running.", 0);
    }
    if (!response.ok)
        throw new ApiError(await readDetail(response), response.status);
    return response.json();
}
export function login(email, password) {
    return postAuth("/auth/login", { email, password });
}
export function signup(email, password, role) {
    return postAuth("/auth/signup", { email, password, role });
}
