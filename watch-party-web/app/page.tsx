"use client";
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import WatchPartyPlayer from '@/components/WatchPartyPlayer';
import ChatPanel from '../components/ChatPanel';

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Varsayılan videoyu artık bir YouTube videosu yapalım
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=bGsl1V6fx-4");
  const [newUrlInput, setNewUrlInput] = useState("");

  useEffect(() => {
    // 1. KISITLAMALARI KALDIRDIK: Socket.io en iyi yolu kendisi bulsun
    const newSocket = io('https://uzakizleme-web.onrender.com');
    
    // 2. AJANLAR: Bağlantı durumunu bize bildirecek
    newSocket.on('connect', () => {
      console.log('✅ KÖPRÜYE BAĞLANILDI! Mükemmel. ID:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ BAĞLANTI KOPTU! Sebep:', err.message);
    });

    newSocket.emit('join_party', { partyId: 'oda-123' });

    newSocket.on('video_changed', (newUrl) => {
      console.log('🎥 Sunucudan yeni video linki geldi:', newUrl);
      setVideoUrl(newUrl);
    });

    setSocket(newSocket);

    return () => { newSocket.disconnect(); };
  }, []);

  const handleVideoChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrlInput.trim() || !socket) return; 
    
    setVideoUrl(newUrlInput);
    socket.emit('change_video', { partyId: 'oda-123', videoUrl: newUrlInput });
    setNewUrlInput(""); 
  };

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8 flex flex-col items-center">
      <h1 className="text-3xl text-white font-bold mb-6 tracking-wide">🎬 Uzaktan İzleme Odası</h1>
      
      <div className="w-full max-w-7xl mb-6 bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-lg">
        <form onSubmit={handleVideoChange} className="flex flex-col md:flex-row gap-3">
          <input 
            type="url" 
            placeholder="Buraya yeni bir YouTube veya video linki yapıştırın..." 
            value={newUrlInput}
            onChange={(e) => setNewUrlInput(e.target.value)}
            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold transition shadow-md whitespace-nowrap">
            Videoyu Değiştir
          </button>
        </form>
      </div>

      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6 items-stretch">
        <div className="flex-[3]">
          <WatchPartyPlayer 
            socket={socket} 
            videoUrl={videoUrl} 
            isHost={true} 
            partyId="oda-123"
          />
        </div>
        <div className="flex-1 flex">
          <ChatPanel 
            socket={socket} 
            partyId="oda-123" 
            username={`Kullanıcı_${Math.floor(Math.random() * 1000)}`} 
          />
        </div>
      </div>
    </main>
  );
}