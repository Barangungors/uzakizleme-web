"use client";
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import WatchPartyPlayer from '@/components/WatchPartyPlayer';
import ChatPanel from '@/components/ChatPanel';
import ScreenShare from '@/components/ScreenShare';
import UserList from '@/components/UserList';
import { playSound } from '@/utils/sound';

export default function Home() {
  const [socket, setSocket] = useState<any>(null);
  const [partyId, setPartyId] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=DzMrabVqiJE");
  const [inputUrl, setInputUrl] = useState("");
  const [hostId, setHostId] = useState("");
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  
  // 🚀 Odadaki kişi sayısını hafızada tutmak için (Ses çalma kontrolü)
  const prevUserCount = useRef(0);

  useEffect(() => {
    // Senin 7/24 açık canlı Render sunucun
    const newSocket = io('https://watch-party-backend-84du.onrender.com');
    setSocket(newSocket);
    
    newSocket.on('room_state', (data) => {
      setVideoUrl(data.videoUrl);
      setHostId(data.hostId);
      
      if (data.users) {
        // 🔔 Odaya YENİ biri girdiyse (ve ilk açılış değilse) "Ding-Dong" çal
        if (prevUserCount.current > 0 && data.users.length > prevUserCount.current) {
          playSound('join');
        }
        
        prevUserCount.current = data.users.length; // Sayıyı güncelle
        setUsers(data.users);
      }
    });

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
      setInputUrl(""); 
    }
  };

  // --- GİRİŞ EKRANI ---
  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <form onSubmit={handleJoin} className="bg-gray-900 p-10 rounded-3xl border border-gray-800 shadow-2xl w-full max-w-md">
          <h2 className="text-2xl text-white font-extrabold mb-8 text-center flex items-center justify-center gap-3">
            <span className="text-3xl">🍿</span> Watch Party'ye Katıl
          </h2>
          <input 
            type="text" placeholder="Adınız" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-800 text-white p-4 rounded-xl mb-5 outline-none border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" required
          />
          <input 
            type="text" placeholder="Oda Adı (Örn: baran-vip)" value={partyId} onChange={(e) => setPartyId(e.target.value)}
            className="w-full bg-gray-800 text-white p-4 rounded-xl mb-8 outline-none border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" required
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold transition duration-200 shadow-lg">Giriş Yap</button>
        </form>
      </div>
    );
  }

  const isHost = socket?.id === hostId;

  // --- ANA ODA EKRANI ---
  return (
    <main className="min-h-screen bg-gray-950 p-6 md:p-10 flex flex-col items-center">
      
      {/* Üst Bilgi Barı */}
      <div className="w-full max-w-[1500px] flex justify-between items-center mb-8 bg-gray-900 p-5 rounded-3xl border border-gray-800 shadow-xl">
        <h1 className="text-2xl text-white font-black tracking-tight flex items-center gap-3">
          🎬 ODA <span className="text-gray-700">|</span> <span className="text-blue-400 font-bold">{partyId}</span>
        </h1>
        <button onClick={() => window.location.reload()} className="text-gray-400 hover:text-white transition font-bold text-sm bg-gray-800 hover:bg-red-600 px-6 py-2.5 rounded-full border border-gray-700">
          Odadan Çık 🚪
        </button>
      </div>

      {/* Video Değiştirme ve Güvenlik Kilidi Alanı */}
      <div className="w-full max-w-[1500px] mb-8">
        {isHost ? (
          <div className="flex gap-4 p-4 bg-gray-900 rounded-3xl border border-gray-800 shadow-xl animate-fade-in">
            <input 
              type="text" placeholder="YouTube Linkini Yapıştır ve Değiştir..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-gray-800 text-white px-5 py-3 rounded-full outline-none border border-gray-700 focus:border-blue-500 transition"
            />
            <button onClick={changeVideo} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-bold transition shadow-xl text-sm">
              Videoyu Değiştir
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 p-5 rounded-3xl border border-red-900/50 text-center text-red-400 font-bold text-sm tracking-wide shadow-xl">
            🔒 Yalnızca oda başkanı videoyu değiştirebilir.
          </div>
        )}
      </div>

      {/* Video, Ekran Paylaşımı, Kullanıcı Listesi ve Sohbet Panelleri */}
      <div className="w-full max-w-[1500px] grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SOL TARAF: VİDEO OYNATICI VE EKRAN PAYLAŞIMI (Geniş Alan) */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-8">
          <WatchPartyPlayer socket={socket} videoUrl={videoUrl} partyId={partyId} hostId={hostId} />
          
          <ScreenShare socket={socket} partyId={partyId} />
        </div>
        
        {/* SAĞ TARAF: KULLANICI LİSTESİ VE SOHBET (Tam Sidebar) */}
        <div className="col-span-1 lg:col-span-1 flex flex-col gap-8 h-full max-h-[850px]">
          {/* UserList paneli */}
          <UserList users={users} hostId={hostId} myId={socket?.id} />
          
          {/* ChatPanel paneli */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel socket={socket} partyId={partyId} username={username} />
          </div>
        </div>
      </div>
      
    </main>
  );
}