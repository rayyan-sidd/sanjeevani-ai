"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import AIChat from "@/components/AIChat";
import { translations, Language } from "@/lib/translations";
import { 
  LogOut, 
  ShieldAlert, 
  Activity, 
  Stethoscope, 
  Wifi,
  Info,
  Languages,
  Zap
} from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  
  // Phase 7: Language State
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Phase 6: Optimized SOS Trigger
  const triggerSOS = async () => {
    const currentUser = user;
    if (!currentUser) return;

    const confirmMessage = lang === 'en' 
      ? "🚨 CONFIRM EMERGENCY SOS? This will alert medical command with your location." 
      : "🚨 क्या आप आपातकालीन SOS भेजना चाहते हैं? आपकी लोकेशन साझा की जाएगी।";

    if (!window.confirm(confirmMessage)) return;

    toast.error(lang === 'en' ? "Initializing SOS..." : "SOS भेज रहा हूँ...");

    try {
      const uid = currentUser.uid;
      const name = currentUser.displayName || "Anonymous Patient";

      // 1. Write Signal Immediately
      const sosDoc = await addDoc(collection(db, "emergencies"), {
        patientId: uid,
        patientName: name,
        timestamp: serverTimestamp(),
        status: "critical",
        location: lang === 'en' ? "Fetching GPS..." : "GPS खोज रहे हैं..."
      });

      toast.success(lang === 'en' ? "Signal Broadcasted!" : "सिग्नल भेज दिया गया!");

      // 2. Background Geolocation Update
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const docRef = doc(db, "emergencies", sosDoc.id);
            await updateDoc(docRef, { 
              location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` 
            });
          },
          async () => {
            const docRef = doc(db, "emergencies", sosDoc.id);
            await updateDoc(docRef, { 
              location: lang === 'en' ? "Location Denied" : "लोकेशन नहीं मिली" 
            });
          }
        );
      }
    } catch (error) {
      toast.error("Network error. Call 102.");
    }
  };

  // Phase 8: Premium Skeleton Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="w-48 h-10 bg-slate-200 animate-pulse rounded-2xl" />
            <div className="w-12 h-12 bg-slate-200 animate-pulse rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 h-[600px] bg-slate-200 animate-pulse rounded-[2.5rem]" />
            <div className="lg:col-span-4 space-y-6">
              <div className="h-64 bg-slate-200 animate-pulse rounded-[2.5rem]" />
              <div className="h-40 bg-slate-200 animate-pulse rounded-[2.5rem]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* GLASSMORPHISM NAV */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200">
            <Stethoscope size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tighter text-slate-900 leading-none">
              Sanjeevani <span className="text-blue-600 font-black">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 hidden md:block">
              Healthcare for the next billion
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* LANGUAGE SWITCHER */}
          <button 
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-2xl text-xs font-bold border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            <Languages size={14} />
            {lang === 'en' ? 'हिंदी' : 'English'}
          </button>

          <button 
            onClick={() => signOut(auth)}
            className="p-3 text-slate-400 hover:text-red-500 transition-colors bg-slate-100 rounded-2xl shadow-inner"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: AI CHAT SECTION */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <Activity size={22} className="text-blue-600" />
                {t.healthAssistant}
              </h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase">AI Online</span>
              </div>
            </div>
            
            <AIChat lang={lang} />
          </div>

          {/* RIGHT: SIDEBAR WIDGETS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* SOS CARD - PHASE 6 */}
            <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
              <div className="bg-red-50 w-14 h-14 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <ShieldAlert className="text-red-600" size={28} />
              </div>
              <h3 className="font-bold text-slate-900 text-xl mb-3 tracking-tight">{t.emergencySOS}</h3>
              <p className="text-xs text-slate-500 mb-8 leading-relaxed font-medium">
                {t.sosDesc}
              </p>
              <button 
                onClick={triggerSOS}
                className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-bold shadow-2xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all uppercase tracking-[0.1em] text-xs"
              >
                {t.sendSOS}
              </button>
            </div>

            {/* CONNECTIVITY CARD - PHASE 7 */}
            <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white relative overflow-hidden group border border-white/5">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                    {t.ruralMode}
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Zap size={14} className="text-blue-400 fill-blue-400" />
                  Low-Bandwidth Logic
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  {t.connectivityDesc}
                </p>
              </div>
              <Wifi size={120} className="absolute -right-8 -bottom-8 text-white/[0.03] group-hover:text-white/[0.07] transition-all duration-700 -rotate-12" />
            </div>

            {/* QUICK TIP CARD */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-[2rem] shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md">
                  <Info size={14} />
                </div>
                <p className="text-[11px] text-blue-900 leading-relaxed font-bold italic">
                  {lang === 'en' 
                    ? "Tip: Use the microphone to describe symptoms in your local dialect for more accurate AI triage." 
                    : "सुझाव: अधिक सटीक एआई विश्लेषण के लिए अपनी स्थानीय भाषा में लक्षणों का वर्णन करने हेतु माइक का उपयोग करें।"}
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* FOOTER LOGO */}
      <footer className="py-10 flex justify-center opacity-20 pointer-events-none grayscale">
        <Stethoscope size={40} />
      </footer>
    </div>
  );
}