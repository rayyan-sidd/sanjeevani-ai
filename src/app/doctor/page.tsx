"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { 
  LogOut, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Stethoscope, 
  ExternalLink,
  Navigation
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
    const q = query(collection(db, "emergencies")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Emergency[];
      setEmergencies(alerts);
    });
    return () => unsubscribe();
  }, [role]);

  const resolveEmergency = async (id: string) => {
    await updateDoc(doc(db, "emergencies", id), { status: "resolved" });
    toast.success("Emergency cleared.");
  };

  // Helper function to open Google Maps
  const openMap = (coords: string) => {
    if (coords === "Locating..." || coords === "GPS Access Denied") {
      toast.error("GPS data not available for this alert.");
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl"><Stethoscope size={20} className="text-white" /></div>
          <h1 className="font-bold text-lg leading-none tracking-tight">Sanjeevani <span className="text-blue-500">Command</span></h1>
        </div>
        <button onClick={() => signOut(auth)} className="text-slate-500 hover:text-red-400 transition-colors"><LogOut size={20} /></button>
      </nav>

      <main className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <div className="relative">
              <ShieldAlert className="text-red-500" />
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25" />
            </div>
            Active Distress Signals
          </h2>
          <span className="text-[10px] bg-slate-900 border border-white/10 px-3 py-1 rounded-full font-mono text-slate-500">
            {emergencies.filter(e => e.status === 'critical').length} LIVE ALERTS
          </span>
        </div>
        
        <div className="grid gap-6">
          {emergencies.length === 0 ? (
            <div className="p-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] text-slate-700 bg-white/[0.01]">
              <p className="font-medium italic">All regional sectors currently clear...</p>
            </div>
          ) : (
            emergencies.map((alert) => (
              <div 
                key={alert.id} 
                className={`group p-8 rounded-[2.5rem] border transition-all duration-500 ${
                  alert.status === 'critical' 
                  ? 'bg-red-500/[0.03] border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]' 
                  : 'bg-slate-900/40 border-white/5 opacity-40 grayscale'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`p-5 rounded-2xl ${alert.status === 'critical' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 text-slate-500'}`}>
                      <Navigation size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl tracking-tight">{alert.patientName || "Anonymous"}</h3>
                      <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 mt-2 font-medium">
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
                          className="flex-1 md:flex-none bg-blue-600/10 text-blue-400 border border-blue-600/20 px-6 py-3 rounded-2xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={14} /> VIEW ON MAP
                        </button>
                        <button 
                          onClick={() => resolveEmergency(alert.id)} 
                          className="flex-1 md:flex-none bg-white text-slate-950 px-6 py-3 rounded-2xl font-bold text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={14} /> RESOLVE
                        </button>
                      </>
                    )}
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