// @ts-nocheck
"use client";
import React, { useEffect, useState, useRef } from 'react';

export default function WatchPartyPlayer({ socket, videoUrl, partyId }) {
  const playerRef = useRef(null);
  const [isHost, setIsHost] = useState(false);
  const [videoId, setVideoId] = useState("");

  // 1. YouTube API'sini Yükle
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Linkten ID çek
    const id = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/)?.[1];
    setVideoId(id);

    // Socket üzerinden sahiplik durumunu al
    socket?.on('room_state', (data) => setIsHost(data.isHost));
    
    // Sunucudan gelen Play/Pause komutlarını uygula
    socket?.on('play', (time) => playerRef.current?.seekTo(time, true) && playerRef.current?.playVideo());
    socket?.on('pause', () => playerRef.current?.pauseVideo());

    return () => { socket?.off('room_state'); socket?.off('play'); socket?.off('pause'); };
  }, [videoUrl, socket]);

  // 2. Oynatıcı Hazır Olduğunda
  window.onYouTubeIframeAPIReady = () => {
    playerRef.current = new window.YT.Player('main-player', {
      events: {
        'onStateChange': (event) => {
          if (!isHost) return; // Sadece HOST emir verebilir
          
          if (event.data === window.YT.PlayerState.PLAYING) {
            socket.emit('play', { partyId, currentTime: playerRef.current.getCurrentTime() });
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            socket.emit('pause', { partyId });
          }
        }
      }
    });
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border-4 border-green-500 shadow-2xl h-[450px]">
      <iframe
        id="main-player"
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&controls=${isHost ? 1 : 0}&origin=${window.location.origin}`}
        frameBorder="0"
        allow="autoplay; encrypted-media"
      ></iframe>
      {!isHost && <div className="absolute inset-0 z-50 bg-transparent" title="Sadece oda sahibi kontrol edebilir" />}
    </div>
  );
}