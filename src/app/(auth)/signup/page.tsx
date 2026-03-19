import AuthForm from "@/components/auth/AuthForm";
import Background3D from "@/components/auth/Background3D";

export const metadata = {
  title: "Sign Up | Poultry PMS",
  description: "Create an account for Poultry Management System",
};

export default function SignUpPage() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a]">
      <Background3D />
      <AuthForm mode="signup" />
    </main>
  );
}
