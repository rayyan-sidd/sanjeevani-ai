"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { 
  collection, query, onSnapshot, doc, updateDoc, 
  deleteDoc, serverTimestamp, getDoc 
} from "firebase/firestore";
import { 
  LogOut, ShieldAlert, MapPin, Clock, CheckCircle, 
  Stethoscope, ExternalLink, Navigation, Trash2, 
  Activity, Sun, Moon, AlertTriangle, Loader2,
  UserCheck, MessageSquare, Zap, CreditCard, Save
} from "lucide-react";
import { toast } from "sonner";

interface Emergency {
  id: string;
  patientName?: string;
  status: "critical" | "accepted" | "resolved";
  type?: "free_sos" | "paid_counseling";
  amountPaid?: number;
  timestamp?: any;
  location?: string;
  doctorId?: string;
}

export default function DoctorDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  // --- CONSULTATION SETTINGS ---
  const [isAvailable, setIsAvailable] = useState(true);
  const [rate, setRate] = useState(500);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (role !== "doctor") router.push("/dashboard");
      else fetchDoctorSettings();
    }
  }, [user, role, loading, router]);

  const fetchDoctorSettings = async () => {
    if (!user) return;
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) {
      setIsAvailable(docSnap.data().isAvailable ?? true);
      setRate(docSnap.data().rate ?? 500);
    }
  };

  const updateSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isAvailable, rate, lastUpdated: serverTimestamp()
      });
      toast.success("Consultation settings updated!");
    } catch (e) { toast.error("Update failed."); }
    setSaving(false);
  };

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (role !== "doctor") return;
    const q = query(collection(db, "emergencies")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Emergency[];
      const sorted = alerts.sort((a, b) => {
        // Keep active (critical/accepted) above resolved
        if (a.status === 'resolved' && b.status !== 'resolved') return 1;
        if (a.status !== 'resolved' && b.status === 'resolved') return -1;
        return (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0);
      });
      setEmergencies(sorted);
    });
    return () => unsubscribe();
  }, [role]);

  const openMap = (coords: string) => {
    if (coords.includes("Locating") || coords.includes("Denied")) {
      toast.error("GPS data pending...");
      return;
    }
    window.open(`https://www.google.com/maps/search/?api=1&query=${coords}`, "_blank");
  };

  const acceptEmergency = async (id: string) => {
    await updateDoc(doc(db, "emergencies", id), {
      status: "accepted",
      doctorId: user?.uid,
      doctorName: user?.displayName,
      acceptedAt: serverTimestamp()
    });
    toast.success("Connection established.");
  };

  const resolveEmergency = async (id: string) => {
    await updateDoc(doc(db, "emergencies", id), { status: "resolved" });
    toast.success("Alert resolved.");
  };

  if (loading) return <div className="h-screen flex items-center justify-center dark:bg-slate-950"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className={`min-h-screen transition-all ${darkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER */}
      <nav className={`sticky top-0 z-50 border-b px-8 py-4 flex justify-between items-center backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20"><Stethoscope size={20} className="text-white" /></div>
          <h1 className="font-bold text-lg tracking-tight">Sanjeevani <span className="text-blue-500 font-black uppercase ml-1">HQ</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl border dark:border-white/10">{darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}</button>
          <button onClick={() => signOut(auth)} className="p-2.5 text-slate-500 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* TRIAGE FEED */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter px-2">
            <Activity size={24} className="text-red-500 animate-pulse" /> Command Center
          </h2>

          <div className="grid gap-6">
            {emergencies.map((alert) => {
              const isPaid = alert.type === "paid_counseling";
              const isFree = alert.type === "free_sos" || !alert.type;

              return (
                <div key={alert.id} className={`p-8 rounded-[2.5rem] border transition-all duration-300 ${
                  alert.status === 'critical' ? 'bg-red-500/5 border-red-500/20 shadow-2xl scale-[1.01]' :
                  alert.status === 'accepted' ? 'bg-emerald-500/5 border-emerald-500/20' : 'opacity-40 grayscale'
                }`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                      <div className={`p-5 rounded-2xl text-white shadow-xl ${alert.status === 'critical' ? 'bg-red-500' : alert.status === 'accepted' ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                        {isPaid ? <CreditCard size={24} /> : <Navigation size={24} className={alert.status === 'critical' ? 'animate-pulse' : ''} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-black text-2xl tracking-tight">{alert.patientName}</h3>
                          {isPaid ? (
                            <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-yellow-500/20 tracking-widest">₹{alert.amountPaid} Counselling</span>
                          ) : (
                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Emergency SOS</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500 mt-2 font-bold uppercase tracking-wide">
                          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500" /> {alert.location}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500" /> {alert.timestamp?.toDate().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {/* FREE SOS: Action Direct */}
                      {isFree && alert.status === 'critical' && (
                        <>
                          <button onClick={() => openMap(alert.location || "")} className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-transform active:scale-95"><ExternalLink size={14} /> Maps</button>
                          <button onClick={() => resolveEmergency(alert.id)} className="flex-1 md:flex-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">Resolve</button>
                        </>
                      )}

                      {/* PAID SOS: Handshake First */}
                      {isPaid && alert.status === 'critical' && (
                        <button onClick={() => acceptEmergency(alert.id)} className="flex-1 md:flex-none bg-yellow-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-yellow-500/20 active:scale-95 transition-all">Accept Booking</button>
                      )}

                      {/* CHAT/RESOLVE FOR ACCEPTED */}
                      {alert.status === 'accepted' && (
                        <>
                          <button className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-90 transition-all"><MessageSquare size={18} /></button>
                          <button onClick={() => resolveEmergency(alert.id)} className="px-8 py-4 bg-slate-900 dark:bg-white dark:text-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-colors">Resolve</button>
                        </>
                      )}

                      <button onClick={() => deleteDoc(doc(db, "emergencies", alert.id))} className="p-3 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SETTINGS & REVENUE SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`p-8 rounded-[2.5rem] border transition-all ${darkMode ? 'bg-slate-900 border-white/5 shadow-black' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-2"><Zap size={14} className="text-yellow-500 fill-yellow-500" /> Virtual Practice</h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                <span className="text-sm font-bold">Online Status</span>
                <button onClick={() => setIsAvailable(!isAvailable)} className={`w-12 h-6 rounded-full transition-all relative ${isAvailable ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAvailable ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Rate (₹)</label>
                <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
              <button onClick={updateSettings} disabled={saving} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save Profile
              </button>
            </div>
          </div>

          <div className={`p-8 rounded-[2.5rem] border transition-all ${darkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Revenue Summary</h4>
             <div className="flex items-end gap-2">
                <span className="text-4xl font-black tracking-tighter text-emerald-500">
                  {/* SUMMING THE ACTUAL amountPaid FROM EACH INDIVIDUAL RECORD */}
                  ₹{emergencies
                    .filter(e => e.type === 'paid_counseling' && (e.status === 'accepted' || e.status === 'resolved'))
                    .reduce((sum, record) => sum + (record.amountPaid || 0), 0)}
                </span>
                <span className="text-[10px] font-bold text-slate-500 pb-2 lowercase italic">total earnings</span>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}