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
  
  // Lobi State'leri
  const [username, setUsername] = useState("");
  const [partyId, setPartyId] = useState("");
  const [password, setPassword] = useState("");
  const [activeRooms, setActiveRooms] = useState<{id: string, userCount: number, hasPassword: boolean}[]>([]);
  const [joinError, setJoinError] = useState("");
  const [joined, setJoined] = useState(false);

  // Oda İçi State'ler
  const [videoUrl, setVideoUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [hostId, setHostId] = useState("");
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  const prevUserCount = useRef(0);

  useEffect(() => {
    const newSocket = io('https://watch-party-backend-84du.onrender.com');
    setSocket(newSocket);
    
    // LOBİ: Aktif odaları al
    newSocket.on('active_rooms', (rooms) => setActiveRooms(rooms));
    
    // LOBİ: Şifre hatası alırsak
    newSocket.on('join_error', (msg) => setJoinError(msg));
    
    // LOBİ: Başarıyla girersek
    newSocket.on('join_success', () => {
      setJoinError("");
      setJoined(true);
    });

    // ODA İÇİ: Durum güncellemeleri
    newSocket.on('room_state', (data) => {
      setVideoUrl(data.videoUrl);
      setHostId(data.hostId);
      if (data.users) {
        if (prevUserCount.current > 0 && data.users.length > prevUserCount.current) playSound('join');
        prevUserCount.current = data.users.length;
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
      // Şifre ile birlikte sunucuya istek at
      socket.emit('join_party', { partyId, username, password });
    }
  };

  const changeVideo = () => {
    if (inputUrl && socket) {
      socket.emit('change_video', { partyId, videoUrl: inputUrl });
      setInputUrl(""); 
    }
  };

  const isHost = socket?.id === hostId;

  // ==========================================
  // 1. FÜTÜRİSTİK LOBİ EKRANI (Odalar ve Şifre)
  // ==========================================
  if (!joined) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Arka Plan Neon Işıkları */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full"></div>

        <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
          
          {/* SOL: ODA KUR / KATIL FORMU */}
          <form onSubmit={handleJoin} className="bg-white/[0.03] backdrop-blur-2xl p-8 rounded-3xl border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
            <h2 className="text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 text-center tracking-wider uppercase">
              Sisteme Bağlan
            </h2>
            
            {joinError && <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-lg mb-4 text-sm font-bold animate-pulse text-center">{joinError}</div>}

            <div className="space-y-4">
              <div>
                <label className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1 block">Kullanıcı Adı</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                  className="w-full bg-black/50 text-white px-5 py-4 rounded-xl border border-cyan-900 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all placeholder-gray-600" placeholder="Ajan_Baran" />
              </div>
              <div>
                <label className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1 block">Oda Kodu</label>
                <input type="text" value={partyId} onChange={(e) => setPartyId(e.target.value)} required
                  className="w-full bg-black/50 text-white px-5 py-4 rounded-xl border border-cyan-900 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all placeholder-gray-600" placeholder="Hedef_Oda_01" />
              </div>
              <div>
                <label className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1 block">Şifre (İsteğe Bağlı)</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 text-white px-5 py-4 rounded-xl border border-cyan-900 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all placeholder-gray-600" placeholder="Boş bırakırsan şifresiz kurulur" />
              </div>
            </div>

            <button className="w-full mt-8 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white p-4 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02]">
              Bağlantıyı Başlat
            </button>
          </form>

          {/* SAĞ: AKTİF ODALAR LİSTESİ */}
          <div className="bg-white/[0.02] backdrop-blur-md p-8 rounded-3xl border border-purple-500/20 shadow-2xl flex flex-col max-h-[550px]">
            <h3 className="text-xl font-bold mb-6 text-purple-400 flex items-center gap-3 tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Aktif Ağlar
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
              {activeRooms.length === 0 ? (
                <div className="text-gray-500 text-center mt-10 text-sm font-medium">Sistemde açık oda bulunamadı. Yeni bir tane kur.</div>
              ) : (
                activeRooms.map((room) => (
                  <div key={room.id} onClick={() => setPartyId(room.id)} 
                    className="bg-black/40 border border-purple-900/50 p-4 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-900/20 transition group flex justify-between items-center">
                    <div>
                      <div className="text-white font-bold group-hover:text-purple-300 transition">{room.id}</div>
                      <div className="text-xs text-gray-500 mt-1">{room.userCount} Kullanıcı İçeride</div>
                    </div>
                    {room.hasPassword ? (
                      <span className="text-red-400 text-lg" title="Şifreli Oda">🔒</span>
                    ) : (
                      <span className="text-green-400 text-lg" title="Açık Oda">🔓</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. FÜTÜRİSTİK ANA ODA EKRANI
  // ==========================================
  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 flex flex-col items-center relative overflow-hidden">
      
      {/* Arka plan ışıkları */}
      <div className="absolute top-0 left-1/4 w-[50%] h-[30%] bg-cyan-900/10 blur-[150px] pointer-events-none"></div>

      {/* Üst Bilgi Barı (Glassmorphism) */}
      <div className="w-full max-w-[1500px] flex justify-between items-center mb-8 bg-white/[0.03] backdrop-blur-xl p-5 rounded-3xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] z-10">
        <h1 className="text-xl text-white font-black tracking-widest uppercase flex items-center gap-3">
          AĞ <span className="text-cyan-800">/</span> <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">{partyId}</span>
        </h1>
        <button onClick={() => window.location.reload()} className="text-cyan-200 hover:text-white transition font-bold text-xs uppercase tracking-widest bg-red-900/30 hover:bg-red-600/80 px-6 py-3 rounded-xl border border-red-500/30">
          Bağlantıyı Kes
        </button>
      </div>

      {/* Video Değiştirme (Başkan Kontrolü) */}
      <div className="w-full max-w-[1500px] mb-8 z-10">
        {isHost ? (
          <div className="flex gap-4 p-4 bg-white/[0.02] backdrop-blur-md rounded-2xl border border-cyan-500/20 shadow-xl">
            <input 
              type="text" placeholder="Hedef URL Giriniz..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 bg-black/60 text-cyan-50 px-5 py-3 rounded-xl outline-none border border-cyan-900/50 focus:border-cyan-400 transition placeholder-gray-600 text-sm"
            />
            <button onClick={changeVideo} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition">
              Senkronize Et
            </button>
          </div>
        ) : (
          <div className="bg-red-900/10 backdrop-blur-md p-4 rounded-2xl border border-red-500/20 text-center text-red-400 font-bold text-xs uppercase tracking-widest shadow-xl">
            🔒 Yalnızca ağ yöneticisi hedefi değiştirebilir.
          </div>
        )}
      </div>

      {/* İçerik Panelleri */}
      <div className="w-full max-w-[1500px] grid grid-cols-1 lg:grid-cols-4 gap-8 z-10">
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-8">
          <WatchPartyPlayer socket={socket} videoUrl={videoUrl} partyId={partyId} hostId={hostId} />
          <ScreenShare socket={socket} partyId={partyId} />
        </div>
        
        <div className="col-span-1 lg:col-span-1 flex flex-col gap-8 h-full max-h-[850px]">
          <UserList users={users} hostId={hostId} myId={socket?.id} />
          <div className="flex-1 overflow-hidden">
            <ChatPanel socket={socket} partyId={partyId} username={username} />
          </div>
        </div>
      </div>
      
    </main>
  );
}