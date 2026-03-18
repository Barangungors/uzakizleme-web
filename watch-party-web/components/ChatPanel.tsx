"use client";
import React, { useEffect, useState, useRef } from 'react';
import { playSound } from '@/utils/sound'; // Ses motorumuz devrede

// TypeScript için veri tiplerini tanımlıyoruz
interface Message {
  sender: string;
  text: string;
  time?: string;
}

interface ChatPanelProps {
  socket: any;
  partyId: string;
  username: string;
}

export default function ChatPanel({ socket, partyId, username }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    
    // Gelen mesajları dinle
    socket.on('receive_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      
      // Mesajı ben GÖNDERMEDİYSEM bildirim sesini çal
      if (msg.sender !== username) {
        playSound('message');
      }
    });
    
    return () => { socket.off('receive_message'); };
  }, [socket, username]);

  // Yeni mesaj gelince ekranı otomatik olarak en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && socket) {
      // Mesajın atıldığı saati alıyoruz (Örn: 21:45)
      const currentTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      // Sunucuya mesajı iletiyoruz
      socket.emit('send_message', { partyId, sender: username, text: input, time: currentTime });
      setInput(""); // Gönderdikten sonra kutuyu temizle
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050510]/60 backdrop-blur-xl rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl z-10">
      
      {/* SOHBET BAŞLIĞI */}
      <div className="bg-black/60 p-5 border-b border-cyan-800/50 flex justify-between items-center">
        <h3 className="text-white text-lg font-extrabold flex items-center gap-3">
          <span className="text-xl">💬</span> Oda Sohbeti
        </h3>
      </div>
      
      {/* MESAJLAR ALANI */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
        {messages.map((msg, i) => {
          const isMyMessage = msg.sender === username;
          
          return (
            <div key={i} className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-cyan-600 mb-1 font-medium">
                {msg.sender} {msg.time && `• ${msg.time}`}
              </span>
              <div className={`px-5 py-3 rounded-xl max-w-[85%] text-sm leading-relaxed ${
                isMyMessage 
                  ? 'bg-cyan-600 text-white rounded-br-none shadow-cyan-500/20 shadow-lg' 
                  : 'bg-black/60 text-white rounded-bl-none border border-cyan-900'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {/* En alta kaydırma hedefi */}
        <div ref={messagesEndRef} />
      </div>

      {/* MESAJ GÖNDERME ALANI */}
      <form onSubmit={sendMessage} className="p-4 bg-black/60 border-t border-cyan-800/50 flex gap-3">
        <input 
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Odada bir şeyler paylaş..." 
          className="flex-1 bg-black/60 text-white px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-500 transition border border-cyan-900"
        />
        <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-full font-bold shadow-lg transition duration-150 flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </form>
    </div>
  );
}