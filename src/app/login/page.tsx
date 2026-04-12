"use client";

import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Stethoscope, 
  User, 
  ShieldCheck, 
  Globe,
  Loader2,
  ChevronRight,
  Shield
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // --- ROLE SECURITY LOGIC ---
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      let finalRole = selectedRole;

      if (!userDoc.exists()) {
        // First time user: Create their profile with the selected role
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: selectedRole,
          createdAt: new Date()
        });
        toast.success(`Account created as a ${selectedRole}`);
      } else {
        // Existing user: Ignore the UI toggle and use the DB role
        finalRole = userDoc.data().role;
        toast.info(`Welcome back! Logged in as ${finalRole}`);
      }

      // Redirect to the correct dashboard based on the database role
      if (finalRole === "doctor") {
        router.push("/doctor");
      } else {
        router.push("/dashboard");
      }

    } catch (error: any) {
      console.error(error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* --- LEFT SIDE: THE MISSION (Branding) --- */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 p-20 flex-col justify-between relative overflow-hidden text-white">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="bg-white p-3 rounded-2xl shadow-2xl">
              <Stethoscope size={32} className="text-blue-600" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic">Sanjeevani <span className="text-blue-200">AI</span></h1>
          </div>
          
          <h2 className="text-6xl font-bold leading-[1.1] mb-8 tracking-tight">
            Healthcare for the <br /> 
            <span className="text-blue-200 underline decoration-blue-400 underline-offset-8">next billion.</span>
          </h2>
          <p className="text-blue-100 text-xl max-w-lg leading-relaxed opacity-90 font-medium">
            Bridging the gap in rural India with AI-powered triage, bilingual support, and instant emergency response.
          </p>
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-[100px] opacity-60" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-400 rounded-full blur-[120px] opacity-40" />
        
        <div className="relative z-10 flex items-center gap-4 text-sm font-bold text-blue-100/70 uppercase tracking-[0.3em]">
           <Globe size={18} /> Distributed Command Center v3.0
        </div>
      </div>

      {/* --- RIGHT SIDE: THE ACTION (Login Form) --- */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-950 transition-colors">
        <div className="w-full max-w-md space-y-10">
          
          <div className="text-center lg:text-left">
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Identity</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-3 font-semibold text-lg">Select your gateway to Sanjeevani</p>
          </div>

          {/* ROLE SELECTOR CARDS */}
          <div className="grid grid-cols-2 gap-5">
            <button
              onClick={() => setSelectedRole('patient')}
              className={`group p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${
                selectedRole === 'patient' 
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' 
                : 'border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-white/10 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${selectedRole === 'patient' ? 'bg-blue-600 text-white shadow-lg shadow-blue-300' : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm'}`}>
                <User size={28} />
              </div>
              <span className={`text-sm font-black uppercase tracking-widest ${selectedRole === 'patient' ? 'text-blue-600' : 'text-slate-500'}`}>Patient</span>
            </button>

            <button
              onClick={() => setSelectedRole('doctor')}
              className={`group p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${
                selectedRole === 'doctor' 
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' 
                : 'border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-white/10 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${selectedRole === 'doctor' ? 'bg-blue-600 text-white shadow-lg shadow-blue-300' : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm'}`}>
                <ShieldCheck size={28} />
              </div>
              <span className={`text-sm font-black uppercase tracking-widest ${selectedRole === 'doctor' ? 'text-blue-600' : 'text-slate-500'}`}>Doctor</span>
            </button>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-5 bg-slate-900 dark:bg-white dark:text-slate-950 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-4 hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] transition-all shadow-2xl shadow-slate-200 dark:shadow-none disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/button/google.svg" className="w-5 h-5" alt="Google" />
                  Continue with Google
                  <ChevronRight size={18} className="opacity-50" />
                </>
              )}
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] bg-slate-200 dark:bg-white/10 flex-1" />
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Shield size={12} className="text-emerald-500" /> Secure Encryption Active
              </div>
              <div className="h-[1px] bg-slate-200 dark:bg-white/10 flex-1" />
            </div>

            <p className="text-center text-[11px] text-slate-400 leading-relaxed font-medium px-10">
              Authorized access only. By continuing, you agree to Sanjeevani's digital triage protocols and privacy standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}