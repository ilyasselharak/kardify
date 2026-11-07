import { describe, expect, it } from "vitest";
import { loginSchema, passwordStrength, registerSchema, resetPasswordSchema } from "./auth";

const valid = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  password: "Str0ng!Pass",
  confirmPassword: "Str0ng!Pass",
  acceptTerms: true,
};

const issues = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path.join("."), i.message]));

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("returns translation keys for each invalid field", () => {
    const r = registerSchema.safeParse({ ...valid, firstName: " ", email: "nope", password: "weakpass", acceptTerms: false });
    expect(issues(r)).toMatchObject({
      firstName: "required",
      email: "emailInvalid",
      password: "passwordWeak",
      acceptTerms: "termsRequired",
    });
  });

  it("requires matching passwords", () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: "Different!1" });
    expect(issues(r)).toEqual({ confirmPassword: "passwordsMismatch" });
  });

  it("mirrors the backend password policy", () => {
    for (const pw of ["short1!A", "NoDigits!!", "nouppercase1!", "NOLOWER1!", "NoSymbol123"]) {
      const ok = registerSchema.safeParse({ ...valid, password: pw, confirmPassword: pw }).success;
      expect(ok, pw).toBe(pw === "short1!A");
    }
  });
});

describe("loginSchema / resetPasswordSchema", () => {
  it("does not apply the strength policy to login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x", rememberMe: false }).success).toBe(true);
  });
  it("validates reset passwords", () => {
    expect(resetPasswordSchema.safeParse({ password: "Str0ng!Pass", confirmPassword: "Str0ng!Pass" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: "weak", confirmPassword: "weak" }).success).toBe(false);
  });
});

describe("passwordStrength", () => {
  it("scores from weak to strong", () => {
    expect(passwordStrength("abc")).toBeLessThanOrEqual(1);
    expect(passwordStrength("Str0ng!Pass")).toBe(4);
    expect(passwordStrength("abcdefgh")).toBe(1);
  });
});
