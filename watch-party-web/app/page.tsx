"use client";
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import WatchPartyPlayer from '@/components/WatchPartyPlayer';
import ChatPanel from '@/components/ChatPanel'; // ChatPanel'i import ettik

export default function Home() {
  const [socket, setSocket] = useState<any>(null);
  const [partyId, setPartyId] = useState("");
  const [username, setUsername] = useState(""); // Kullanıcı adı eklendi
  const [joined, setJoined] = useState(false);
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=DzMrabVqiJE");
  const [inputUrl, setInputUrl] = useState("");
  const [hostId, setHostId] = useState("");

  useEffect(() => {
   // ŞUNUNLA DEĞİŞTİR:
const newSocket = io('https://watch-party-backend-84du.onrender.com');
    setSocket(newSocket);
    
    newSocket.on('room_state', (data) => {
      setVideoUrl(data.videoUrl);
      setHostId(data.hostId);
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

  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <form onSubmit={handleJoin} className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-md">
          <h2 className="text-2xl text-white font-bold mb-6">🍿 Watch Party'ye Katıl</h2>
          <input 
            type="text" placeholder="Adınız" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-800 text-white p-4 rounded-lg mb-4 outline-none border border-gray-700" required
          />
          <input 
            type="text" placeholder="Oda Adı" value={partyId} onChange={(e) => setPartyId(e.target.value)}
            className="w-full bg-gray-800 text-white p-4 rounded-lg mb-6 outline-none border border-gray-700" required
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-lg font-bold">Giriş Yap</button>
        </form>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-[1400px] mb-6 flex gap-3">
        <input 
          type="text" placeholder="YouTube Linkini Yapıştır ve Değiştir..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)}
          className="flex-1 bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 outline-none focus:border-blue-500"
        />
        <button onClick={changeVideo} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold">Videoyu Değiştir</button>
      </div>

      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-6">
        {/* SOL TARAF: VİDEO OYNATICI */}
        <div className="flex-[3]">
          <WatchPartyPlayer socket={socket} videoUrl={videoUrl} partyId={partyId} hostId={hostId} />
        </div>
        
        {/* SAĞ TARAF: SOHBET (CHAT) */}
        <div className="flex-1">
          <ChatPanel socket={socket} partyId={partyId} username={username} />
        </div>
      </div>
    </main>
  );
}