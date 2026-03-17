"use client";
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import WatchPartyPlayer from '@/components/WatchPartyPlayer';
import ChatPanel from '../components/ChatPanel';

function getYouTubeId(url: string) {
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // 🚀 TEST LİNKİ BURAYA EKLENDİ
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=DzMrabVqiJE");
  const [newUrlInput, setNewUrlInput] = useState("");

  useEffect(() => {
    const newSocket = io('https://uzakizleme-web.onrender.com');
    setSocket(newSocket);
    
    newSocket.emit('join_party', { partyId: 'oda-123' });

    newSocket.on('video_changed', (newUrl) => {
      setVideoUrl(newUrl);
    });

    return () => { newSocket.disconnect(); };
  }, []);

  const handleVideoChange = (e: React.FormEvent) => {
    e.preventDefault();
    const id = getYouTubeId(newUrlInput);
    
    if (id && socket) {
      const cleanUrl = `https://www.youtube.com/watch?v=${id}`;
      socket.emit('change_video', { partyId: 'oda-123', videoUrl: cleanUrl });
      setNewUrlInput(""); 
    } else {
      alert("Lütfen geçerli bir YouTube linki yapıştırın!");
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8 flex flex-col items-center">
      <h1 className="text-3xl text-white font-bold mb-6 tracking-wide">🎬 Baran'ın İzleme Odası</h1>
      
      <div className="w-full max-w-7xl mb-6 bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-lg">
        <form onSubmit={handleVideoChange} className="flex flex-col md:flex-row gap-3">
          <input 
            type="text" 
            placeholder="YouTube linkini buraya yapıştırın..." 
            value={newUrlInput}
            onChange={(e) => setNewUrlInput(e.target.value)}
            className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold transition shadow-md">
            Videoyu Değiştir
          </button>
        </form>
      </div>
      
    
      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6">
        <div className="flex-[3]">
          <WatchPartyPlayer key={videoUrl} socket={socket} videoUrl={videoUrl} partyId="oda-123" />
        </div>
        <div className="flex-1">
          <ChatPanel socket={socket} partyId="oda-123" username="Baran" />
        </div>
      </div>
    </main>
  );
}