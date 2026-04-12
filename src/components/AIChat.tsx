"use client";

import { useState, useRef, useEffect } from "react";
import { getChatResponse, getVisionResponse } from "@/lib/gemini";
import { 
  Send, Bot, Loader2, User, Image as ImageIcon, 
  X, Mic, Volume2, Square 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { translations, Language } from "@/lib/translations";

export default function AIChat({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string; image?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // --- AUDIO OUTPUT (TTS) ---
  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const hasHindi = text.match(/[\u0900-\u097F]/);
      utterance.lang = (lang === 'hi' || hasHindi) ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // --- VOICE INPUT (STT) ---
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input not supported.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleSend = async () => {
    if ((!input.trim() && !image) || loading) return;
    if (window.speechSynthesis) stopSpeaking();

    const userMessage = { 
      role: "user", 
      text: input || (lang === 'hi' ? "फोटो देखें" : "See photo"), 
      image: image || undefined 
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    const currentInput = input;
    const currentImage = image;
    setInput("");
    setImage(null);

    try {
      let responseText = "";
      if (currentImage) {
        const base64Data = currentImage.split(",")[1];
        const mimeType = currentImage.split(";")[0].split(":")[1];
        responseText = await getVisionResponse(currentInput || "Analyze simply.", base64Data, mimeType);
      } else {
        const history = messages.map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }]
        }));
        responseText = await getChatResponse(currentInput, history);
      }
      setMessages((prev) => [...prev, { role: "model", text: responseText }]);
    } catch (error) {
      toast.error("AI Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden relative">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-6 opacity-20"
            >
              <Bot size={48} className="text-blue-600 mb-4" />
              <p className="font-bold text-slate-900 tracking-tight">{t.healthAssistant}</p>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`p-2 rounded-xl shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"}`}>
                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} className="text-blue-600" />}
                  </div>
                  
                  <div className={`p-4 rounded-3xl text-sm ${
                    msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none shadow-md" 
                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm"
                  }`}>
                    {msg.image && <img src={msg.image} className="max-w-xs rounded-xl mb-3 border border-white/20 shadow-sm" />}
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {msg.role === "model" && (
                  <button 
                    onClick={() => isSpeaking ? stopSpeaking() : speak(msg.text)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-100 text-[10px] font-black text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all ml-10 shadow-sm"
                  >
                    {isSpeaking ? <Square size={10} className="fill-current" /> : <Volume2 size={12} />}
                    {isSpeaking ? "STOP" : "LISTEN"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start ml-10">
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 items-center bg-slate-100 p-2 rounded-[2rem] focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <label className="p-3 text-slate-400 hover:text-blue-600 cursor-pointer">
            <ImageIcon size={20} />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setImage(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
          </label>
          
          <button onClick={startListening} className={`p-3 transition-all ${isListening ? "text-red-500 animate-pulse" : "text-slate-400 hover:text-blue-600"}`}>
            <Mic size={20} />
          </button>
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isListening ? t.listening : t.chatPlaceholder}
            className="flex-1 bg-transparent px-2 py-2 text-sm outline-none text-slate-800 font-medium"
          />
          
          <button onClick={handleSend} disabled={loading} className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}