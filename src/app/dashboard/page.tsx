"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { 
  collection, addDoc, serverTimestamp, doc, updateDoc, 
  query, where, onSnapshot 
} from "firebase/firestore";
import AIChat from "@/components/AIChat";
import { translations, Language } from "@/lib/translations";
import { 
  LogOut, ShieldAlert, Activity, Stethoscope, Wifi, 
  Languages, Zap, Sun, Moon, Phone, MapPin, 
  HeartPulse, Loader2, Navigation, Users, MessageSquare,
  CreditCard, ChevronRight, UserCheck // <--- UserCheck added
} from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  
  const [lang, setLang] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<any>(null);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const t = translations[lang];

  // --- ROLE GUARD ---
  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (role === "doctor") router.push("/doctor");
    }
  }, [user, loading, role, router]);

  // --- SYNC THEME ---
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // --- FETCH ACTIVE SOS & NEARBY DOCTORS ---
  useEffect(() => {
    if (!user || role !== "patient") return;

    // 1. Listen for current patient's SOS status
    const qSOS = query(
      collection(db, "emergencies"), 
      where("patientId", "==", user.uid),
      where("status", "!=", "resolved")
    );
    const unsubSOS = onSnapshot(qSOS, (snap) => {
      if (!snap.empty) setActiveEmergency({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setActiveEmergency(null);
    });

    // 2. Listen for registered Doctors
    const qDocs = query(collection(db, "users"), where("role", "==", "doctor"));
    const unsubDocs = onSnapshot(qDocs, (snap) => {
      setAvailableDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubSOS(); unsubDocs(); };
  }, [user, role]);

  // --- SOS LOGIC (FREE) ---
  const triggerSOS = async () => {
    if (!window.confirm(lang === 'en' ? "Trigger FREE Emergency SOS?" : "क्या आप मुफ़्त आपातकालीन SOS भेजना चाहते हैं?")) return;
    try {
      await addDoc(collection(db, "emergencies"), {
        patientId: user?.uid,
        patientName: user?.displayName,
        status: "critical",
        type: "free_sos",
        timestamp: serverTimestamp(),
        location: "Locating..."
      });
      toast.error("Emergency Alert Broadcasted!");
    } catch (e) { toast.error("SOS Failed"); }
  };

  // --- COUNSELLING LOGIC (PAID) ---
  const startConsultation = async (doctor: any) => {
    const fee = doctor.rate || 500;
    if (!window.confirm(`Proceed to pay ₹${fee} for a 15-min SOS Counselling session with ${doctor.displayName}?`)) return;

    toast.loading("Redirecting to Secure Gateway...");
    
    // Simulating Payment Delay
    setTimeout(async () => {
      try {
        await addDoc(collection(db, "emergencies"), {
          patientId: user?.uid,
          patientName: user?.displayName,
          status: "critical",
          type: "paid_counseling",
          amountPaid: fee,
          targetDoctorId: doctor.uid, // Targeted request
          doctorName: doctor.displayName,
          timestamp: serverTimestamp(),
          location: "Virtual Consultation"
        });
        toast.dismiss();
        toast.success("Payment Verified! Doctor notified.");
      } catch (e) { toast.error("Payment Error"); }
    }, 2000);
  };

  if (loading) return <div className="h-screen flex items-center justify-center dark:bg-slate-950"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* NAVBAR */}
      <nav className={`sticky top-0 z-50 border-b px-6 py-4 flex justify-between items-center backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20"><Stethoscope size={20} className="text-white" /></div>
          <h1 className="font-black text-xl tracking-tighter italic">Sanjeevani AI</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10">{darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}</button>
          <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="px-4 py-2.5 rounded-xl border border-blue-600/20 bg-blue-600/5 text-blue-600 text-xs font-black uppercase tracking-widest">{lang === 'en' ? 'हिंदी' : 'English'}</button>
          <button onClick={() => signOut(auth)} className="p-2.5 text-slate-400 hover:text-red-500"><LogOut size={18} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: CHAT */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter"><Activity size={22} className="text-blue-600" /> AI Triage Unit</h2>
          <AIChat lang={lang} />
        </div>

        {/* RIGHT: SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* DYNAMIC CONNECTION CARD */}
          <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all ${darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
            {!activeEmergency ? (
              <>
                <div className="bg-red-50 dark:bg-red-500/10 w-14 h-14 rounded-3xl flex items-center justify-center mb-6 text-red-600"><ShieldAlert size={28} /></div>
                <h3 className="font-black text-xl mb-2 tracking-tight">{t.emergencySOS}</h3>
                <p className="text-xs text-slate-500 mb-8 font-medium leading-relaxed">{t.sosDesc}</p>
                <button onClick={triggerSOS} className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all text-xs tracking-widest">{t.sendSOS}</button>
              </>
            ) : activeEmergency.status === "critical" ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="font-black text-red-500 animate-pulse tracking-widest uppercase text-sm">Signal Broadcasting...</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-relaxed">Alerting medical HQ & nearby specialists</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex items-center gap-4">
                   <div className="p-3 bg-emerald-500 text-white rounded-2xl"><UserCheck size={20} /></div>
                   <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Medical Responder</p>
                      <h4 className="font-black text-lg">{activeEmergency.doctorName}</h4>
                   </div>
                </div>
                <button className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all">
                  <MessageSquare size={18} /> OPEN SECURE CHAT
                </button>
              </div>
            )}
          </div>

          {/* PAID CONSULTATION MARKETPLACE */}
          <div className={`p-8 rounded-[2.5rem] border transition-all ${darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
              <Zap size={14} className="text-yellow-500 fill-yellow-500" /> Nearby SOS Counselling
            </h4>
            <div className="space-y-4">
              {availableDoctors.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No specialists active currently...</p>
              ) : (
                availableDoctors.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-blue-600/30 transition-all group">
                    <div>
                      <p className="text-xs font-black">{doc.displayName}</p>
                      <p className="text-[9px] text-blue-500 font-black tracking-widest uppercase mt-1 flex items-center gap-1">
                        <CreditCard size={10} /> ₹{doc.rate || 500} / 15 MIN
                      </p>
                    </div>
                    <button 
                      onClick={() => startConsultation(doc)}
                      className="p-2 bg-blue-600/10 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* EMERGENCY CONTACTS */}
          <div className={`p-8 rounded-[2.5rem] border transition-all ${darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2"><Phone size={14} /> Local Aid</h4>
            <div className="space-y-3">
              <a href="tel:102" className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all">
                <span className="text-xs font-black uppercase">Ambulance (102)</span>
                <HeartPulse size={16} />
              </a>
              <a href="#" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 text-slate-500">
                <span className="text-xs font-black uppercase">Nearby PHC</span>
                <MapPin size={16} />
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}