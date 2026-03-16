"use client";
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import WatchPartyPlayer from '../components/WatchPartyPlayer';
import ChatPanel from '../components/ChatPanel';

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // YENİ: Video linkini artık sabit değil, değiştirilebilir (dinamik) yapıyoruz
  const [videoUrl, setVideoUrl] = useState("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
  const [newUrlInput, setNewUrlInput] = useState("");

  useEffect(() => {
    // Kendi Render linkinin burada olduğundan emin ol!
    const newSocket = io('https://uzakizleme-web.onrender.com', {
  transports: ['websocket'], // Sadece en hızlı yolu kullan
  upgrade: false
});
    
    newSocket.emit('join_party', { partyId: 'oda-123' });

    // YENİ: Sunucudan "video değişti" haberi gelirse, ekrandaki videoyu güncelle
    newSocket.on('video_changed', (newUrl) => {
      setVideoUrl(newUrl);
    });

    return () => { newSocket.disconnect(); };
  }, []);

  // YENİ: Değiştir butonuna basıldığında çalışacak görev
  const handleVideoChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrlInput.trim() || !socket) return;
    
    // Hem kendi ekranında videoyu değiştir, hem de köprüye (sunucuya) haber ver
    setVideoUrl(newUrlInput);
    socket.emit('change_video', { partyId: 'oda-123', videoUrl: newUrlInput });
    setNewUrlInput(""); // Kutuyu temizle
  };

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8 flex flex-col items-center">
      <h1 className="text-3xl text-white font-bold mb-6 tracking-wide">🎬 Uzaktan İzleme Odası</h1>
      
      {/* YENİ: URL Yapıştırma Çubuğu */}
      <div className="w-full max-w-7xl mb-6 bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-lg">
        <form onSubmit={handleVideoChange} className="flex flex-col md:flex-row gap-3">
          <input 
            type="url" 
            placeholder="Buraya yeni bir MP4 video linki yapıştırın (örn: https://.../video.mp4)" 
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
            videoUrl={videoUrl} // Artık burası yukarıdaki dinamik state'e bağlı
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