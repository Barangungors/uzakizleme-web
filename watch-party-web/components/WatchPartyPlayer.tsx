// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// 🚀 VERCEL HATASININ ÇÖZÜMÜ: Sadece 'react-player' yazıyoruz, alt yolları sildik.
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

    // Sunucudan gelen Play/Pause komutlarını dinle
    socket.on('play', (time) => {
      setPlaying(true);
      if (Math.abs(playerRef.current?.getCurrentTime() - time) > 2) {
        playerRef.current?.seekTo(time, 'seconds');
      }
    });

    socket.on('pause', () => setPlaying(false));

    socket.on('seek', (time) => playerRef.current?.seekTo(time, 'seconds'));

    return () => {
      socket.off('play'); socket.off('pause'); socket.off('seek');
    };
  }, [socket]);

  if (!isMounted) return null;

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border-4 border-green-500 shadow-2xl">
      <ReactPlayer
        key={videoUrl} // Video değişince oynatıcıyı tazeler
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={playing}
        controls={true}
        // Oynatıcıyı eklentilerden koruyan özel YouTube ayarları
        config={{
          youtube: {
            playerVars: { origin: window.location.origin, modestbranding: 1 }
          }
        }}
        onPlay={() => socket?.emit('play', { partyId, currentTime: playerRef.current?.getCurrentTime() })}
        onPause={() => socket?.emit('pause', { partyId, currentTime: playerRef.current?.getCurrentTime() })}
        onSeek={(seconds) => socket?.emit('seek', { partyId, currentTime: seconds })}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
}