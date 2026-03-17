"use client";
import React, { useEffect, useState, useRef } from 'react';
import { playSound } from '@/utils/sound'; // 🚀 Ses motorunu içeri aldık
interface Message {
  sender: string;
  text: string;
  time: string;
}

// 1. Props'ların (dışarıdan gelen verilerin) tipini tanımlıyoruz
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
    
    socket.on('receive_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      
      // 🚀 EĞER MESAJI BEN ATMADIYSAM "POP" SESİ ÇAL
      if (msg.sender !== username) {
        playSound('message');
      }
    });
    
    return () => { socket.off('receive_message'); };
  }, [socket, username]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && socket) {
      socket.emit('send_message', { partyId, sender: username, text: input });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
      
      {/* SOHBET BAŞLIĞI */}
      <div className="bg-gray-950 p-5 border-b border-gray-800">
        <h3 className="text-white text-lg font-extrabold flex items-center gap-3">
          <span className="text-xl">💬</span> Oda Sohbeti
        </h3>
      </div>
      
      {/* MESAJLAR ALANI */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {messages.map((msg, i) => {
          const isMyMessage = msg.sender === username;
          
          return (
            <div key={i} className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-gray-600 mb-1 font-medium">{msg.sender} • {msg.time}</span>
              <div className={`px-5 py-3 rounded-xl max-w-[85%] text-sm leading-relaxed ${
                isMyMessage 
                  ? 'bg-blue-600 text-white rounded-br-none shadow-blue-500/20 shadow-lg' 
                  : 'bg-gray-800 text-white rounded-bl-none border border-gray-700'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* MESAJ GÖNDERME ALANI */}
      <form onSubmit={sendMessage} className="p-4 bg-gray-950 border-t border-gray-800 flex gap-3">
        <input 
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Odada bir şeyler paylaş..." 
          className="flex-1 bg-gray-800 text-white px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-500 transition border border-gray-700"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full font-bold shadow-lg transition duration-150 flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </form>
    </div>
  );
}