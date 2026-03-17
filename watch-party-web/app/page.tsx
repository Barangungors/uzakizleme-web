"use client";
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import WatchPartyPlayer from '@/components/WatchPartyPlayer';

export default function Home() {
  const [socket, setSocket] = useState<any>(null);
  const [partyId, setPartyId] = useState("");
  const [joined, setJoined] = useState(false);
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=DzMrabVqiJE");
  const [inputUrl, setInputUrl] = useState("");

  useEffect(() => {
    const newSocket = io('https://uzakizleme-web.onrender.com');
    setSocket(newSocket);
    newSocket.on('video_changed', (newUrl) => setVideoUrl(newUrl));
    return () => { newSocket.disconnect(); };
  }, []);

  const handleJoin = (e: any) => {
    e.preventDefault();
    if (partyId && socket) {
      socket.emit('join_party', { partyId, username: "Baran" });
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
          <h2 className="text-2xl text-white font-bold mb-6">🎬 Watch Party Giriş</h2>
          <input 
            type="text" placeholder="Oda Adı girin..." value={partyId} onChange={(e) => setPartyId(e.target.value)}
            className="w-full bg-gray-800 text-white p-4 rounded-lg mb-4 outline-none border border-gray-700" required
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-lg font-bold">Odaya Katıl</button>
        </form>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl mb-6 flex gap-3">
        <input 
          type="text" placeholder="YouTube Linki..." value={inputUrl} onChange={(e) => setInputUrl(e.target.value)}
          className="flex-1 bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700"
        />
        <button onClick={changeVideo} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold">Video Değiştir</button>
      </div>
      <div className="w-full max-w-7xl">
        {/* Hata Veren Satır Düzeldi */}
        <WatchPartyPlayer socket={socket} videoUrl={videoUrl} partyId={partyId} setVideoUrl={setVideoUrl} />
      </div>
    </main>
  );
}