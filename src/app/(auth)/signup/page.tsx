import { SignUp } from "@clerk/nextjs";
import Background3D from "@/components/auth/Background3D";

export const metadata = {
  title: "Sign Up | Poultry PMS",
  description: "Create an account for Poultry Management System",
};

export default function SignUpPage() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center py-10">
      <Background3D />
      <div className="relative z-10 w-full max-w-md p-6">
        <SignUp 
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl shadow-blue-500/10",
              headerTitle: "text-white font-black text-2xl tracking-tighter",
              headerSubtitle: "text-white/60 font-bold",
              socialButtonsBlockButton: "border border-white/10 hover:bg-white/5 text-white/90 font-bold justify-center",
              dividerLine: "bg-white/10",
              dividerText: "text-white/40 font-bold uppercase tracking-widest text-[10px]",
              formFieldLabel: "text-white/70 font-bold text-xs uppercase tracking-widest",
              formFieldInput: "bg-white/5 border border-white/10 focus:border-blue-500/50 text-white rounded-xl placeholder:text-white/20",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]",
              footerActionText: "text-white/60",
              footerActionLink: "text-blue-400 font-bold hover:text-blue-300",
            }
          }}
        />
      </div>
    </main>
  );
}
