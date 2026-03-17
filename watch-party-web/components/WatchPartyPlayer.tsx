// @ts-nocheck
"use client";
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export default function WatchPartyPlayer({ socket, videoUrl, partyId, hostId }) {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const isHost = socket?.id === hostId;

  useEffect(() => {
    setIsMounted(true);
    if (!socket) return;

    socket.on('command_play', (time) => {
      // Saniye farkı 2'den fazlaysa atla (Sürekli başa sarmayı engeller)
      if (playerRef.current && Math.abs(playerRef.current.getCurrentTime() - time) > 2) {
        playerRef.current.seekTo(time, 'seconds');
      }
      setPlaying(true);
    });

    socket.on('command_pause', () => setPlaying(false));

    return () => { socket.off('command_play'); socket.off('command_pause'); };
  }, [socket]);

  if (!isMounted) return <div className="h-[500px] w-full bg-black rounded-2xl animate-pulse" />;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border-4 border-green-500 shadow-2xl h-[500px]">
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={playing}
        controls={isHost} // Sadece Başkan kontrolleri görür
        onPlay={() => {
          if (isHost) {
            setPlaying(true);
            socket.emit('play_video', { partyId, time: playerRef.current?.getCurrentTime() });
          }
        }}
        onPause={() => {
          if (isHost) {
            setPlaying(false);
            socket.emit('pause_video', { partyId });
          }
        }}
        // 🚀 MOBİL CİHAZLAR İÇİN HAYATİ AYARLAR
        config={{
          youtube: {
            playerVars: { 
              origin: typeof window !== 'undefined' ? window.location.origin : '',
              playsinline: 1, // Telefondan girince tam ekrana fırlamasını engeller
            }
          }
        }}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />

      {/* İZLEYİCİ İÇİN UYARI */}
      {!isHost && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-50">
          👀 Sadece Başkan Kontrol Edebilir
        </div>
      )}
      {!isHost && <div className="absolute inset-0 z-40 bg-transparent" />}
    </div>
  );
}