// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// 🚀 ÇÖZÜM 1: Next.js'in ve eklentilerin müdahale edemeyeceği şekilde "Dinamik" yüklüyoruz.
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export default function WatchPartyPlayer({ socket, videoUrl, partyId }) {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [hasWindow, setHasWindow] = useState(false);

  useEffect(() => {
    setHasWindow(true); // Sadece tarayıcıda çalışmasını garanti et
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('play', (time) => {
      setPlaying(true);
      playerRef.current?.seekTo(time, 'seconds');
    });

    socket.on('pause', (time) => {
      setPlaying(false);
    });

    return () => {
      socket.off('play');
      socket.off('pause');
    };
  }, [socket]);

  if (!hasWindow) return <div className="w-full aspect-video bg-black rounded-2xl animate-pulse" />;

  return (
    /* 🚀 ÇÖZÜM 2: 'key' prop'u sayesinde link değişince oynatıcıyı "öldürüp yeniden doğuruyoruz" */
    <div key={videoUrl} className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border-4 border-green-500 shadow-2xl">
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={playing}
        controls={true}
        // 🚀 ÇÖZÜM 3: Eklentilerin videoyu çalmasını engelleyen özel ayarlar
        config={{
          youtube: {
            playerVars: { 
              autoplay: 1, 
              modestbranding: 1, 
              rel: 0,
              origin: window.location.origin 
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
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
}