// @ts-nocheck
"use client";
import React, { useEffect, useState, useRef } from 'react';

export default function WatchPartyPlayer({ socket, videoUrl, partyId }) {
  const playerRef = useRef(null);
  const [isHost, setIsHost] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // 1. SSR (Vercel Build) Hatasını Engelleyen Kilit
  useEffect(() => {
    setIsMounted(true);
    
    // YouTube API'sini yükle
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Linkten ID çek
    const id = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/)?.[1];
    setVideoId(id);

    // Socket dinleyicileri
    if (socket) {
      socket.on('room_state', (data) => setIsHost(data.isHost));
      socket.on('play', (time) => {
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(time, true);
          playerRef.current.playVideo();
        }
      });
      socket.on('pause', () => playerRef.current?.pauseVideo?.());
    }

    return () => {
      socket?.off('room_state');
      socket?.off('play');
      socket?.off('pause');
    };
  }, [videoUrl, socket]);

  // 2. YouTube Oynatıcıyı Kurma (Sadece tarayıcıda çalışır)
  useEffect(() => {
    if (!isMounted || !videoId) return;

    const createPlayer = () => {
      playerRef.current = new window.YT.Player('main-player', {
        events: {
          'onStateChange': (event) => {
            if (!isHost) return; 
            if (event.data === window.YT.PlayerState.PLAYING) {
              socket?.emit('play', { partyId, currentTime: playerRef.current.getCurrentTime() });
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              socket?.emit('pause', { partyId });
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }
  }, [isMounted, videoId, isHost, socket, partyId]);

  if (!isMounted || !videoId) return <div className="h-[450px] bg-black rounded-2xl flex items-center justify-center text-white">Oda Hazırlanıyor...</div>;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border-4 border-green-500 shadow-2xl h-[450px]">
      <div id="main-player" className="w-full h-full"></div>
      {/* Sahip olmayanların videoya tıklamasını engelle (Sadece izlesinler) */}
      {!isHost && (
        <div className="absolute inset-0 z-50 bg-transparent cursor-not-allowed" title="Sadece oda sahibi kontrol edebilir" />
      )}
    </div>
  );
}