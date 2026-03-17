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

  if (!isMounted) return null;

  return (
    /* 1. ÖNEMLİ: Kapsayıcıya net bir yükseklik/genişlik veriyoruz */
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border-2 border-green-500 shadow-2xl min-h-[300px]">
      <ReactPlayer
        /* 🚀 2. SİHİRLİ SATIR: key={videoUrl} sayesinde link değişince oynatıcı sıfırdan başlar */
        key={videoUrl} 
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={playing}
        controls={true}
        onPlay={() => {
          setPlaying(true);
          socket?.emit('play', { partyId, currentTime: playerRef.current?.getCurrentTime() });
        }}
        onPause={() => {
          setPlaying(false);
          socket?.emit('pause', { partyId, currentTime: playerRef.current?.getCurrentTime() });
        }}
        /* YouTube engellerini aşmak için eklenen ayarlar */
        config={{
          youtube: {
            playerVars: { showinfo: 1, origin: typeof window !== 'undefined' ? window.location.origin : '' }
          }
        }}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
}