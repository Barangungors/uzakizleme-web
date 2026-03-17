"use client";
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import WatchPartyPlayer from '@/components/WatchPartyPlayer';
import ChatPanel from '@/components/ChatPanel';
import ScreenShare from '@/components/ScreenShare';

export default function Home() {
  const [socket, setSocket] = useState<any>(null);
  const [partyId, setPartyId] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=DzMrabVqiJE");
  const [inputUrl, setInputUrl] = useState("");
  const [hostId, setHostId] = useState("");

  // 1. RENDER SUNUCUSUNA BAĞLANTI (Senin canlı linkin)
  useEffect(() => {
    const newSocket = io('https://watch-party-backend-84du.onrender.com');
    setSocket(newSocket);
    
    // Odaya girince mevcut durumu al
    newSocket.on('room_state', (data) => {
      setVideoUrl(data.videoUrl);
      setHostId(data.hostId);
    });

    // Video değiştiğinde yeni linki ve başkanı al
    newSocket.on('video_changed', (data) => {
      setVideoUrl(data.videoUrl);
      setHostId(data.hostId);
    });

    return () => { newSocket.disconnect(); };
  }, []);

  const handleJoin = (e: any) => {
    e.preventDefault();
    if (partyId && username && socket) {
      socket.emit('join_party', { partyId, username });
      setJoined(true);
    }
  };

  const changeVideo = () => {
    if (inputUrl && socket) {
      socket.emit('change_video', { partyId, videoUrl: inputUrl });
      setInputUrl(""); // Inputu temizle
    }
  };

  // 2. GİRİŞ EKRANI (Kullanıcı adı ve Oda numarası)
  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <form onSubmit={handleJoin} className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-md">
          <h2 className="text-2xl text-white font-bold mb-6">🍿 Watch Party'ye Katıl</h2>
          <input 
            type="text" placeholder="Adınız" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-800 text-white p-4 rounded-lg mb-4 outline-none border border-gray-700 focus:border-blue-500" required
          />
          <input 
            type="text" placeholder="Oda Adı (Örn: baran-vip)" value={partyId} onChange={(e) => setPartyId(e.target.value)}
            className="w-full bg-gray-800 text-white p-4 rounded-lg mb-6 outline-none border border-gray-700 focus:border-blue-500" required
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-lg font-bold transition">Giriş Yap</button>
        </form>
      </div>
    );
  }

  // Güvenlik Kontrolü: Şu anki kullanıcı Başkan mı?
  const isHost = socket?.id === hostId;

  // 3. ANA ODA EKRANI (Video ve Chat)
  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8 flex flex-col items-center">
      
      {/* Üst Bilgi Barı */}
      <div className="w-full max-w-[1400px] flex justify-between items-center mb-6">
        <h1 className="text-xl text-white font-bold">🎬 Oda: <span className="text-blue-400">{partyId}</span></h1>
        <button onClick={() => window.location.reload()} className="text-gray-400 hover:text-white transition font-medium">Odadan Çık</button>
      </div>

      {/* 🚀 BAŞKAN GÜVENLİK KİLİDİ */}
      {isHost ? (
        <div className="w-full max-w-[1400px] mb-6 flex gap-3 animate-fade-in">
          <input 
            type="text" placeholder="YouTube Linkini Yapıştır ve Değiştir..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 outline-none focus:border-blue-500"
          />
          <button onClick={changeVideo} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold transition shadow-lg">Videoyu Değiştir</button>
        </div>
      ) : (
        <div className="w-full max-w-[1400px] mb-6 bg-gray-900 p-4 rounded-lg border border-red-900/50 text-center text-red-400 font-medium">
          🔒 Sadece oda başkanı videoyu değiştirebilir.
        </div>
      )}

      {/* Video ve Sohbet Panelleri Yan Yana */}
      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-6">
        {/* SOL TARAF: VİDEO OYNATICI (Geniş Alan) */}
        <div className="flex-[3]">
          <WatchPartyPlayer socket={socket} videoUrl={videoUrl} partyId={partyId} hostId={hostId} />
        </div>
        
        {/* SAĞ TARAF: SOHBET (Dar Alan) */}
        <div className="flex-1">
          <ChatPanel socket={socket} partyId={partyId} username={username} />
        </div>
      </div>
      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-6">
        <div className="flex-[3]">
          <WatchPartyPlayer socket={socket} videoUrl={videoUrl} partyId={partyId} hostId={hostId} />
        </div>
        <div className="flex-1">
          <ChatPanel socket={socket} partyId={partyId} username={username} />
        </div>
      </div>

      {/* 🚀 İŞTE YENİ EKRAN PAYLAŞIM ALANIMIZ */}
      <div className="w-full max-w-[1400px]">
        <ScreenShare socket={socket} partyId={partyId} />
      </div>
      
    </main>
  );
}