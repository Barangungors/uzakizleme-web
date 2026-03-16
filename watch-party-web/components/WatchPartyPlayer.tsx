// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// 🚀 DÜZELTİLEN SATIR BURASI: "/youtube" kısmını sildik, ana paketi çağırıyoruz.
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export default function WatchPartyPlayer({ socket, partyId }) {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [url, setUrl] = useState("");
  const [isReady, setIsReady] = useState(false);

  // SUNUCUDAN GELEN KOMUTLARI DİNLE
  useEffect(() => {
    if (!socket) return;

    socket.on('room_state', (state) => {
      setUrl(state.videoUrl);
      setPlaying(state.isPlaying);
      if (playerRef.current) playerRef.current.seekTo(state.currentTime, 'seconds');
    });

    socket.on('video_changed', (newUrl) => {
      setUrl(newUrl);
      setPlaying(false);
      if (playerRef.current) playerRef.current.seekTo(0);
    });

    socket.on('play', (time) => {
      setPlaying(true);
      if (playerRef.current) {
        const current = playerRef.current.getCurrentTime();
        if (Math.abs(current - time) > 2) {
          playerRef.current.seekTo(time, 'seconds');
        }
      }
    });

    socket.on('pause', (time) => {
      setPlaying(false);
      if (playerRef.current) playerRef.current.seekTo(time, 'seconds');
    });

    socket.on('seek', (time) => {
      if (playerRef.current) playerRef.current.seekTo(time, 'seconds');
    });

    return () => {
      socket.off('room_state');
      socket.off('video_changed');
      socket.off('play');
      socket.off('pause');
      socket.off('seek');
    };
  }, [socket]);

  // KULLANICI ETKİLEŞİMLERİNİ SUNUCUYA GÖNDER
  const handlePlay = () => {
    setPlaying(true);
    if (socket && playerRef.current) {
      socket.emit('play', { partyId, currentTime: playerRef.current.getCurrentTime() });
    }
  };

  const handlePause = () => {
    setPlaying(false);
    if (socket && playerRef.current) {
      socket.emit('pause', { partyId, currentTime: playerRef.current.getCurrentTime() });
    }
  };

  const handleSeek = (seconds) => {
    if (socket) {
      socket.emit('seek', { partyId, currentTime: seconds });
    }
  };

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border-2 border-gray-700">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center text-white z-10 bg-black">
          ⏳ YouTube Bağlanıyor...
        </div>
      )}
      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        playing={playing}
        controls={true}
        onReady={() => setIsReady(true)}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeek={handleSeek}
        style={{ position: 'absolute', top: 0, left: 0 }} 
      />
    </div>
  );
}