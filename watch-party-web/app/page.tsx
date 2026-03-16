"use client";
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import WatchPartyPlayer from '@/components/WatchPartyPlayer';
// Eğer ChatPanel hata verirse burayı '@/components/ChatPanel' olarak değiştir
import ChatPanel from '../components/ChatPanel'; 

export default function Home() {
  // 🚀 İŞTE EKRANIN DONMASINI ENGELLEYEN SİHİRLİ KİLİT
  const [isMounted, setIsMounted] = useState(false);
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=aqz-KE-bpKQ");
  const [newUrlInput, setNewUrlInput] = useState("");

  useEffect(() => {
    // Sayfa tamamen yüklendiğinde kilidi aç ve donmayı engelle!
    setIsMounted(true);

    const newSocket = io('https://uzakizleme-web.onrender.com');
    
    newSocket.on('connect', () => console.log('✅ Köprüye bağlanıldı!'));

    newSocket.emit('join_party', { partyId: 'oda-123' });

    newSocket.on('video_changed', (newUrl) => {
      console.log('🎥 Ekran güncelleniyor, yeni link:', newUrl);
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

  // 🚀 EKRAN KİLİTLİYKEN BEYAZ BİR YÜKLENİYOR EKRANI GÖSTER
  if (!isMounted) {
    return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center font-bold text-2xl">Oda Yükleniyor... Kilit Açılıyor ⏳</div>;
  }

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8 flex flex-col items-center">
<h1 className="text-3xl text-white font-bold mb-6 tracking-wide">🎬 Baran'ın İzleme Odası</h1>      
      <div className="w-full max-w-7xl mb-6 bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-lg">
        <form onSubmit={handleVideoChange} className="flex flex-col md:flex-row gap-3">
          <input 
            type="url" 
            placeholder="Buraya yeni bir YouTube linki yapıştırın..." 
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