"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { 
  LogOut, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Stethoscope, 
  ExternalLink,
  Navigation,
  Trash2,
  Activity
} from "lucide-react";
import { toast } from "sonner";

interface Emergency {
  id: string;
  patientName?: string;
  status: "critical" | "resolved";
  timestamp?: any;
  location?: string;
}

export default function DoctorDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (role !== "doctor") router.push("/dashboard");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (role !== "doctor") return;
    
    // We fetch all records and sort them LOCALLY to avoid Firebase Index errors
    const q = query(collection(db, "emergencies")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Emergency[];
      
      // SORTING FIX: Newest (highest timestamp) at the top
      const sorted = alerts.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeB - timeA;
      });

      setEmergencies(sorted);
    });
    return () => unsubscribe();
  }, [role]);

  const resolveEmergency = async (id: string) => {
    try {
      await updateDoc(doc(db, "emergencies", id), { status: "resolved" });
      toast.success("Emergency status updated to Resolved.");
    } catch (e) {
      toast.error("Update failed.");
    }
  };

  const deleteEmergency = async (id: string) => {
    if (window.confirm("Permanently delete this emergency record?")) {
      try {
        await deleteDoc(doc(db, "emergencies", id));
        toast.info("Record deleted successfully.");
      } catch (e) {
        toast.error("Deletion failed.");
      }
    }
  };

  const openMap = (coords: string) => {
    if (coords.includes("Locating") || coords.includes("Denied")) {
      toast.error("Location data is still pending or was denied.");
      return;
    }
    const url = `https://www.google.com/maps?q=${coords}`;
    window.open(url, "_blank");
  };

  if (loading) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
       <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Stethoscope size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-lg leading-none tracking-tight">
            Sanjeevani <span className="text-blue-500">Command</span>
          </h1>
        </div>
        <button onClick={() => signOut(auth)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
          <LogOut size={20} />
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="relative">
                <ShieldAlert className="text-red-500" />
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
              </div>
              Triage Feed
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium tracking-wide">Monitoring real-time distress signals</p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900/50 border border-white/5 px-4 py-2 rounded-2xl">
             <Activity size={14} className="text-emerald-500" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
               {emergencies.filter(e => e.status === 'critical').length} Critical Alerts
             </span>
          </div>
        </div>
        
        <div className="grid gap-6">
          {emergencies.length === 0 ? (
            <div className="p-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
              <p className="text-slate-600 font-medium italic">All sectors reporting clear...</p>
            </div>
          ) : (
            emergencies.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-8 rounded-[2.5rem] border transition-all duration-500 hover:translate-x-1 ${
                  alert.status === 'critical' 
                  ? 'bg-red-500/[0.03] border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.05)]' 
                  : 'bg-slate-900/20 border-white/5 opacity-40'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`p-5 rounded-2xl ${alert.status === 'critical' ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-slate-800 text-slate-500'}`}>
                      <Navigation size={22} className={alert.status === 'critical' ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl tracking-tight leading-tight">{alert.patientName || "Anonymous Patient"}</h3>
                      <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500 mt-2 font-semibold">
                        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500" /> {alert.location}</span>
                        <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500" /> {alert.timestamp?.toDate().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {alert.status === 'critical' && (
                      <>
                        <button 
                          onClick={() => openMap(alert.location || "")}
                          className="flex-1 md:flex-none bg-blue-600/10 text-blue-400 border border-blue-600/20 px-5 py-3 rounded-2xl font-bold text-[11px] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 tracking-wider"
                        >
                          <ExternalLink size={14} /> MAP
                        </button>
                        <button 
                          onClick={() => resolveEmergency(alert.id)} 
                          className="flex-1 md:flex-none bg-white text-slate-950 px-5 py-3 rounded-2xl font-bold text-[11px] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 tracking-wider"
                        >
                          <CheckCircle size={14} /> RESOLVE
                        </button>
                      </>
                    )}
                    
                    {/* DELETE BUTTON */}
                    <button 
                      onClick={() => deleteEmergency(alert.id)}
                      className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                      title="Permanently Delete Record"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}