import { loadSession } from "./authStorage";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
export class ApiError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}
function toAbsoluteUrl(path) {
    if (/^https?:\/\//.test(path))
        return path; // already absolute
    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
export async function predictImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    const headers = {};
    const session = loadSession();
    if (session)
        headers.Authorization = `Bearer ${session.access_token}`;
    let response;
    try {
        response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers,
            body: formData,
        });
    }
    catch {
        throw new ApiError("Could not reach the analysis server. Check that the backend is running.", 0);
    }
    if (!response.ok) {
        let detail = `Request failed with status ${response.status}.`;
        try {
            const body = await response.json();
            if (typeof body?.detail === "string")
                detail = body.detail;
        }
        catch {
            // response body wasn't JSON
        }
        throw new ApiError(detail, response.status);
    }
    const data = await response.json();
    return {
        ...data,
        original_url: toAbsoluteUrl(data.original_url),
        heatmap_url: toAbsoluteUrl(data.heatmap_url),
    };
}
