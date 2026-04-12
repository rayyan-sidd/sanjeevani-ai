"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Stethoscope, User, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (selectedRole: "patient" | "doctor") => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 1. Check if user already exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // 2. New User: Save their chosen role
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: selectedRole,
          createdAt: new Date(),
        });
        toast.success(`Registered successfully as a ${selectedRole}!`);
      } else {
        // 3. Existing User: Use their stored role (ignore the button clicked)
        const actualRole = userSnap.data().role;
        toast.success(`Welcome back, ${user.displayName}`);
        router.push(actualRole === "doctor" ? "/doctor" : "/dashboard");
        return;
      }

      // 4. Redirect New User
      router.push(selectedRole === "doctor" ? "/doctor" : "/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.error("Authentication failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-blue-50 rounded-2xl mb-4">
            <Stethoscope className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sanjeevani AI</h1>
          <p className="text-slate-500 text-sm mt-1">Select your portal to continue</p>
        </div>

        <div className="space-y-4">
          {/* Patient Option */}
          <button
            onClick={() => handleLogin("patient")}
            className="group w-full flex items-center p-4 border-2 border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 text-left"
          >
            <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-blue-100 transition-colors">
              <User className="w-6 h-6 text-slate-600 group-hover:text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="font-bold text-slate-800">I am a Patient</p>
              <p className="text-xs text-slate-500 font-medium">Get AI consultation & SOS</p>
            </div>
          </button>

          {/* Doctor Option */}
          <button
            onClick={() => handleLogin("doctor")}
            className="group w-full flex items-center p-4 border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-200 text-left"
          >
            <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <ShieldCheck className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="font-bold text-slate-800">I am a Doctor</p>
              <p className="text-xs text-slate-500 font-medium">Manage triage & emergencies</p>
            </div>
          </button>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Powered by Gemini 1.5 Flash
        </p>
      </div>
    </div>
  );
}