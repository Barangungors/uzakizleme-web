// @ts-nocheck
"use client";
import React, { useEffect, useState, useRef } from 'react';

export default function WatchPartyPlayer({ socket, videoUrl, partyId, hostId }) {
  const playerRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [videoId, setVideoId] = useState("");

  const isHost = socket?.id === hostId;

  // 1. YouTube API Yüklemesi ve Sunucu Emirleri (Rave Sistemi)
  useEffect(() => {
    setIsMounted(true);
    
    // Linkten ID'yi çek
    const id = videoUrl?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (id) setVideoId(id);

    // YouTube Iframe API Scriptini Ekle
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Başkandan gelen senkronizasyon komutlarını dinle
    if (socket) {
      socket.on('command_play', (time) => {
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          if (Math.abs(playerRef.current.getCurrentTime() - time) > 2) {
            playerRef.current.seekTo(time, true);
          }
          playerRef.current.playVideo();
        }
      });
      socket.on('command_pause', () => {
        if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
      });
    }

    return () => {
      socket?.off('command_play');
      socket?.off('command_pause');
    };
  }, [socket, videoUrl]);

  // 2. Orijinal Yıkılmaz Oynatıcıyı Kurma
  useEffect(() => {
    if (!isMounted || !videoId) return;

    const initPlayer = () => {
      // Eğer oynatıcı zaten açıksa sadece videoyu değiştir (Sayfayı yenilemeden)
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById(videoId);
        return;
      }

      // İlk defa açılıyorsa yıkılmaz Iframe'i kur
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: { 
          autoplay: 1, 
          controls: isHost ? 1 : 0, // Sadece başkan kontrolleri görür
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          playsinline: 1,
          rel: 0
        },
        events: {
          'onStateChange': (event) => {
            if (!isHost || !socket) return;
            const currentTime = playerRef.current.getCurrentTime();
            // Başkan oynatır veya durdurursa herkese haber ver
            if (event.data === window.YT.PlayerState.PLAYING) {
              socket.emit('play_video', { partyId, time: currentTime });
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              socket.emit('pause_video', { partyId });
            }
          }
        }
      });
    };

    // YouTube API'si hazırsa hemen kur, değilse hazır olmasını bekle
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [isMounted, videoId, isHost, partyId, socket]);

  if (!isMounted) return <div className="h-[500px] w-full bg-black rounded-2xl flex items-center justify-center text-white font-bold">Oda Kuruluyor...</div>;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border-4 border-green-500 shadow-2xl h-[500px]">
      
      {/* İŞTE SENİN HATASIZ ÇALIŞAN ESKİ DOSTUN: HAM YOUTUBE DIV'İ */}
      <div id="youtube-player" className="w-full h-full"></div>
      
      {!isHost && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-50">
          👀 İzleyici Modu (Sadece Başkan Kontrol Edebilir)
        </div>
      )}
      {!isHost && <div className="absolute inset-0 z-40 bg-transparent cursor-not-allowed" />}
    </div>
  );
}