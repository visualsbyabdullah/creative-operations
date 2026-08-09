import { describe, expect, it } from "vitest";

import {
  emailChangeErrorMessage,
  emailInputState,
} from "@/lib/profiles/email-change-ui";

describe("email change UI", () => {
  it.each([
    ["", "empty"],
    ["invalid", "invalid"],
    ["USER@EXAMPLE.COM", "same"],
    ["new@example.com", "valid"],
  ] as const)("classifies %s as %s", (candidate, expected) => {
    expect(emailInputState("user@example.com", candidate)).toBe(expected);
  });

  it("maps provider failures to safe messages", () => {
    expect(emailChangeErrorMessage("email_conflict")).toBe(
      "This email address is already in use.",
    );
    expect(emailChangeErrorMessage("temporarily_unavailable")).toBe(
      "Email change could not be started. Please try again.",
    );
  });
});
