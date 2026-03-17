// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export default function WatchPartyPlayer({ socket, videoUrl, partyId }) {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('play', (time) => {
      setPlaying(true);
      playerRef.current?.seekTo(time, 'seconds');
    });

    socket.on('pause', () => setPlaying(false));
    socket.on('seek', (time) => playerRef.current?.seekTo(time, 'seconds'));

    return () => {
      socket.off('play'); socket.off('pause'); socket.off('seek');
    };
  }, [socket]);

  if (!isMounted) return null;

  return (
    <div 
      key={videoUrl}
      className="relative w-full rounded-2xl overflow-hidden bg-black border-4 border-green-500 shadow-2xl"
      style={{ height: '450px', width: '100%', clear: 'both' }} // Net yükseklik verdik
    >
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        playing={playing}
        controls={true}
        width="100%"
        height="100%"
        // 🚀 KRİTİK AYAR: YouTube'un "Ben buradayım" demesini sağlıyor
        config={{
          youtube: {
            playerVars: { 
              origin: window.location.origin, // Kendi sitemizin adresini YouTube'a tanıtıyoruz
              enablejsapi: 1,
              modestbranding: 1,
              rel: 0
            }
          }
        }}
        onPlay={() => {
          setPlaying(true);
          socket?.emit('play', { partyId, currentTime: playerRef.current?.getCurrentTime() });
        }}
        onPause={() => {
          setPlaying(false);
          socket?.emit('pause', { partyId, currentTime: playerRef.current?.getCurrentTime() });
        }}
        // Görüntü gelmezse diye konsola rapor versin
        onReady={() => console.log("✅ YouTube Görüntüsü Başarıyla Yüklendi!")}
        onError={(e) => console.log("❌ YouTube Yükleme Hatası:", e)}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
}