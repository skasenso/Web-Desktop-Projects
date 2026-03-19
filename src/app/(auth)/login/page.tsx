import AuthForm from "@/components/auth/AuthForm";
import Background3D from "@/components/auth/Background3D";

export const metadata = {
  title: "Login | Poultry PMS",
  description: "Sign in to your Poultry Management System",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a]">
      <Background3D />
      <AuthForm mode="login" />
    </main>
  );
}
