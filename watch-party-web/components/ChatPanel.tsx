// @ts-nocheck
"use client";
import React, { useEffect, useState, useRef } from 'react';
// ... kodun geri kalanı aynı kalacak ...
export default function ChatPanel({ socket, partyId, username }) {
  const [messages, setMessages] = useState<{sender: string, text: string, time: string}[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => { socket.off('receive_message'); };
  }, [socket]);

  // Yeni mesaj gelince en alta kaydır
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
    <div className="flex flex-col h-[500px] bg-gray-900 rounded-2xl border-2 border-gray-700 overflow-hidden shadow-xl">
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-white font-bold">💬 Oda Sohbeti</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.sender === username ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-gray-400 mb-1">{msg.sender} • {msg.time}</span>
            <div className={`px-4 py-2 rounded-lg max-w-[80%] ${msg.sender === username ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-gray-800 flex gap-2">
        <input 
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Mesaj yaz..." 
          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg outline-none"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold">Gönder</button>
      </form>
    </div>
  );
}