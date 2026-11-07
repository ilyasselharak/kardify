import { AuthShell } from "@/components/auth/auth-shell";

export default function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  return <AuthShell>{children}</AuthShell>;
}
