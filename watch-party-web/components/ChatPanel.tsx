import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface ChatProps {
  socket: Socket | null;
  partyId: string;
  username: string;
}

export default function ChatPanel({ socket, partyId, username }: ChatProps) {
  const [messages, setMessages] = useState<{user: string, text: string, time: string}[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!socket) return;

    // Sunucudan yeni mesaj gelirse listeye ekle
    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => { socket.off('receive_message'); };
  }, [socket]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    const newMsg = { user: username, text: input, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    socket.emit('send_message', { partyId, message: newMsg });
    setInput(''); // Kutuyu temizle
  };

  return (
    <div className="w-full h-[500px] md:w-80 md:h-auto bg-gray-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-gray-700">
      <div className="bg-gray-900 p-4 border-b border-gray-700">
        <h2 className="text-white font-semibold">💬 Oda Sohbeti</h2>
      </div>
      
      {/* Mesaj Listesi */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.user === username ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-gray-400 mb-1">{m.user} • {m.time}</span>
            <div className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${m.user === username ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Mesaj Yazma Kutusu */}
      <form onSubmit={sendMessage} className="p-3 bg-gray-900 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mesaj yaz..." 
          className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg font-bold transition">
          Gönder
        </button>
      </form>
    </div>
  );
}