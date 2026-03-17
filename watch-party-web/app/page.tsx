"use client";
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import WatchPartyPlayer from '@/components/WatchPartyPlayer';

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [partyId, setPartyId] = useState(""); // Oda ismi artık dinamik
  const [joined, setJoined] = useState(false);
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=DzMrabVqiJE");
  const [newUrlInput, setNewUrlInput] = useState("");

  useEffect(() => {
    const newSocket = io('https://uzakizleme-web.onrender.com');
    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, []);

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (partyId && socket) {
      socket.emit('join_party', { partyId, username: "Baran" });
      setJoined(true);
    }
  };

  const handleVideoChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrlInput && socket) {
      socket.emit('change_video', { partyId, videoUrl: newUrlInput });
      setNewUrlInput("");
    }
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <form onSubmit={joinRoom} className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-md">
          <h2 className="text-2xl text-white font-bold mb-6">Oda Oluştur veya Katıl</h2>
          <input 
            type="text" placeholder="Oda Adı (Örn: baran-oda)" 
            className="w-full bg-gray-800 text-white p-4 rounded-lg mb-4 outline-none border border-gray-700 focus:border-blue-500"
            value={partyId} onChange={(e) => setPartyId(e.target.value)} required
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-lg font-bold transition">Odaya Gir</button>
        </form>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl flex justify-between items-center mb-6">
        <h1 className="text-xl text-white font-bold">🎬 Oda: <span className="text-blue-400">{partyId}</span></h1>
        <button onClick={() => window.location.reload()} className="text-gray-400 text-sm hover:text-white">Odadan Çık</button>
      </div>
      
      <div className="w-full max-w-7xl mb-6 bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-lg flex gap-3">
        <input 
          type="text" placeholder="YouTube linkini yapıştır..." 
          value={newUrlInput} onChange={(e) => setNewUrlInput(e.target.value)}
          className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleVideoChange} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition">Değiştir</button>
      </div>

      <div className="w-full max-w-7xl">
        <WatchPartyPlayer socket={socket} videoUrl={videoUrl} partyId={partyId} setVideoUrl={setVideoUrl} />
      </div>
    </main>
  );
}