"use client";
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import WatchPartyPlayer from '../components/WatchPartyPlayer';
import ChatPanel from '../components/ChatPanel';

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);

  // Sayfa açıldığında sunucuya (köprüye) bağlan
  useEffect(() => {
    const newSocket = io('http://localhost:3001'); // Adım 2'de yazdığımız sunucu
    setSocket(newSocket);
    
    // Odaya katıl
    newSocket.emit('join_party', { partyId: 'oda-123' });

    return () => { newSocket.disconnect(); };
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8 flex flex-col items-center">
      <h1 className="text-3xl text-white font-bold mb-8 tracking-wide">🎬 Uzaktan İzleme Odası</h1>
      
      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6 items-stretch">
        {/* Sol Taraf: Video Alanı (Daha geniş) */}
        <div className="flex-[3]">
          <WatchPartyPlayer 
            socket={socket} 
            videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
            isHost={true} // Kendini test etmek istersen bir sekmede true, diğerinde false yapabilirsin
            partyId="oda-123"
          />
        </div>

        {/* Sağ Taraf: Sohbet Alanı */}
        <div className="flex-1 flex">
          <ChatPanel 
            socket={socket} 
            partyId="oda-123" 
            username={`Kullanıcı_${Math.floor(Math.random() * 1000)}`} // Geçici rastgele isim
          />
        </div>
      </div>
    </main>
  );
}