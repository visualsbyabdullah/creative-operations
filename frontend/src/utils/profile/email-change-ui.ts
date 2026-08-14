export type EmailInputState = "empty" | "invalid" | "same" | "valid";

export function emailInputState(currentEmail: string, candidate: string): EmailInputState {
  const email = candidate.trim().toLowerCase();
  if (!email) return "empty";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return "invalid";
  return email === currentEmail.trim().toLowerCase() ? "same" : "valid";
}

export function emailChangeErrorMessage(code: string): string {
  if (code === "email_conflict") return "This email address is already in use.";
  if (code === "rate_limited") return "Too many email change attempts. Please try again later.";
  return "Email change could not be started. Please try again.";
}
