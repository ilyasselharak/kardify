import { z } from "zod";

/** Error messages are translation keys from the `validation` namespace. Mirrors backend PASSWORD_REGEX. */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

const email = z.string().trim().min(1, "required").email("emailInvalid").max(254, "tooLong");
const password = z.string().min(1, "required").regex(PASSWORD_REGEX, "passwordWeak");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "required"),
  rememberMe: z.boolean(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "required").max(80, "tooLong"),
    lastName: z.string().trim().min(1, "required").max(80, "tooLong"),
    email,
    password,
    confirmPassword: z.string().min(1, "required"),
    acceptTerms: z.boolean().refine((v) => v, "termsRequired"),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "passwordsMismatch" });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string().min(1, "required") })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "passwordsMismatch" });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, "required"), newPassword: password, confirmPassword: z.string().min(1, "required") })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "passwordsMismatch" });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Password strength 0–4 for the strength meter. */
export function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 14 && score === 4) return 4;
  return Math.min(score, pw.length >= 8 ? 4 : 1);
}
