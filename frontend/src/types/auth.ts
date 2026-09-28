export type UserRole = "technician" | "general";

export interface AuthSession {
  access_token: string;
  role: UserRole;
  email: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  technician: "Medical technician",
  general: "General user",
};