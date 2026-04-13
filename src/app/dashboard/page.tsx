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
  CreditCard, ChevronRight, UserCheck
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

  // --- THEME SYNC ---
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // --- REAL-TIME DATA SUBSCRIPTIONS ---
  useEffect(() => {
    if (!user || role !== "patient") return;

    // 1. Listen for active SOS (Using simple query to avoid index errors)
    const qSOS = query(collection(db, "emergencies"), where("patientId", "==", user.uid));
    const unsubSOS = onSnapshot(qSOS, (snap) => {
      const active = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((item: any) => item.status !== "resolved")
        .sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      
      setActiveEmergency(active.length > 0 ? active[0] : null);
    });

    // 2. Listen for online Doctors
    const qDocs = query(collection(db, "users"), where("role", "==", "doctor"));
    const unsubDocs = onSnapshot(qDocs, (snap) => {
      setAvailableDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubSOS(); unsubDocs(); };
  }, [user, role]);

  // --- SOS LOGIC (FREE + LOCATION FIX) ---
  const triggerSOS = async () => {
    if (!user) return;
    if (!window.confirm(lang === 'en' ? "CONFIRM FREE SOS BROADCAST?" : "क्या आप मुफ़्त SOS सेवा चाहते हैं?")) return;

    try {
      const docRef = await addDoc(collection(db, "emergencies"), {
        patientId: user.uid,
        patientName: user.displayName || "Anonymous",
        status: "critical",
        type: "free_sos",
        timestamp: serverTimestamp(),
        location: "Locating..."
      });

      toast.error("SOS Signal Sent!");

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const coords = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
            await updateDoc(doc(db, "emergencies", docRef.id), { location: coords });
            toast.success("GPS Verified.");
          },
          async () => {
            await updateDoc(doc(db, "emergencies", docRef.id), { location: "GPS Unavailable" });
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    } catch (e) { toast.error("SOS Failed"); }
  };

  // --- PAID COUNSELING LOGIC ---
  const startConsultation = async (doctor: any) => {
    const fee = doctor.rate || 500;
    if (!window.confirm(`Pay ₹${fee} to start SOS counseling with ${doctor.displayName}?`)) return;

    toast.loading("Processing Payment...");
    setTimeout(async () => {
      try {
        await addDoc(collection(db, "emergencies"), {
          patientId: user?.uid,
          patientName: user?.displayName,
          status: "critical",
          type: "paid_counseling",
          amountPaid: fee,
          doctorId: doctor.uid,
          doctorName: doctor.displayName,
          timestamp: serverTimestamp(),
          location: "Virtual Consultation"
        });
        toast.dismiss();
        toast.success("Consultation Booked!");
      } catch (e) { toast.error("Booking Error"); }
    }, 1500);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Securing Session...</p>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-[#020617] text-white' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      {/* --- NAVBAR --- */}
      <nav className={`sticky top-0 z-50 border-b px-6 py-4 flex justify-between items-center backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20"><Stethoscope size={20} className="text-white" /></div>
          <h1 className="font-black text-xl tracking-tighter italic uppercase">Sanjeevani</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10">{darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}</button>
          <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="px-4 py-2.5 rounded-xl border border-blue-600/20 bg-blue-600/5 text-blue-600 text-[10px] font-black uppercase tracking-widest">{lang === 'en' ? 'हिंदी' : 'English'}</button>
          <button onClick={() => signOut(auth)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT: AI TRIAGE --- */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter"><Activity size={22} className="text-blue-600" /> AI Diagnostic Unit</h2>
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Edge Online
            </div>
          </div>
          <AIChat lang={lang} />
        </div>

        {/* --- RIGHT: ACTIONS --- */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* DYNAMIC RESPONSE CARD */}
          <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all ${darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
            {!activeEmergency ? (
              <>
                <div className="bg-red-50 dark:bg-red-500/10 w-14 h-14 rounded-3xl flex items-center justify-center mb-6 text-red-600"><ShieldAlert size={28} /></div>
                <h3 className="font-black text-xl mb-2 tracking-tight">{t.emergencySOS}</h3>
                <p className="text-xs text-slate-500 mb-8 font-medium leading-relaxed">{t.sosDesc}</p>
                <button onClick={triggerSOS} className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all text-xs tracking-widest uppercase">{t.sendSOS}</button>
              </>
            ) : activeEmergency.status === "critical" ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="font-black text-red-500 animate-pulse tracking-widest uppercase text-sm">Broadcasting Signal...</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Awaiting Doctor Response</p>
                <div className="text-[9px] bg-slate-100 dark:bg-white/5 p-2 rounded-lg text-slate-400">Current GPS: {activeEmergency.location}</div>
              </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in duration-500">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex items-center gap-4">
                   <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20"><UserCheck size={20} /></div>
                   <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Responder Active</p>
                      <h4 className="font-black text-lg leading-none mt-1">{activeEmergency.doctorName}</h4>
                   </div>
                </div>
                <button className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all uppercase text-xs tracking-widest">
                  <MessageSquare size={18} /> Direct Messaging
                </button>
              </div>
            )}
          </div>

          {/* COUNSELING MARKETPLACE */}
          <div className={`p-8 rounded-[2.5rem] border transition-all ${darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2"><Zap size={14} className="text-yellow-500 fill-yellow-500" /> Specialist Hub</h4>
            <div className="space-y-4">
              {availableDoctors.filter(d => d.uid !== user?.uid).map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-blue-600/30 transition-all group">
                  <div>
                    <p className="text-xs font-black">{doc.displayName}</p>
                    <p className="text-[9px] text-blue-500 font-black uppercase mt-1">₹{doc.rate || 500} / 15 MINS</p>
                  </div>
                  <button onClick={() => startConsultation(doc)} className="p-2 bg-blue-600/10 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><ChevronRight size={16} /></button>
                </div>
              ))}
              {availableDoctors.length === 0 && <p className="text-[10px] italic text-slate-400 text-center">No specialists online...</p>}
            </div>
          </div>

          {/* LOCAL AID */}
          <div className={`p-8 rounded-[2.5rem] border transition-all ${darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2"><Phone size={14} /> Rural Aid</h4>
            <div className="space-y-3">
              <a href="tel:102" className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all">
                <span className="text-xs font-black uppercase tracking-widest">Ambulance (102)</span>
                <HeartPulse size={16} />
              </a>
              <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 opacity-50">
                 <div className="flex items-center justify-between text-slate-500">
                   <span className="text-xs font-black uppercase tracking-widest">Nearby PHC</span>
                   <MapPin size={16} />
                 </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}