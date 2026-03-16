import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface ChatProps {
  socket: Socket | null;
  partyId: string;
  username: string;
}

export default function ChatPanel({ socket, partyId, username }: ChatProps) {
  const [messages, setMessages] = useState<{user: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Yeni mesaj geldiğinde en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sunucudan (Köprüden) gelen mesajları dinle
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data: {user: string, text: string}) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket]);

  // Mesaj Gönderme
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    const msgData = { partyId, user: username, text: input };
    socket.emit('send_message', msgData); // Köprüye yolla
    setInput('');
  };

  return (
    <div className="w-full h-[500px] bg-gray-900 rounded-xl border border-gray-700 flex flex-col overflow-hidden shadow-2xl">
      <div className="p-4 bg-gray-800 border-b border-gray-700 font-bold text-white flex items-center gap-2">
        💬 Oda Sohbeti
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded-xl ${msg.user === username ? 'bg-blue-600 ml-auto rounded-tr-none' : 'bg-gray-700 mr-auto rounded-tl-none'} max-w-[80%] text-white text-sm shadow-md`}>
            <span className="font-bold text-xs opacity-75 block mb-1">{msg.user}</span>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Mesaj yaz..."
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-lg font-bold transition shadow-md">
          Gönder
        </button>
      </form>
    </div>
  );
}