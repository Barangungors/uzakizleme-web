// @ts-nocheck
"use client";
import React, { useEffect, useState, useRef } from 'react';

export default function WatchPartyPlayer({ socket, videoUrl, partyId, setVideoUrl }) {
  const playerRef = useRef(null);
  const [isHost, setIsHost] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    // Sunucudan gelen emirleri dinle (Durdur/Başlat/Saniye)
    socket?.on('room_state', (data) => setIsHost(socket.id === data.hostId));
    socket?.on('server_command', ({ action, time }) => {
      if (playerRef.current && playerRef.current.getPlayerState) {
        if (action === 'play') {
          playerRef.current.seekTo(time, true);
          playerRef.current.playVideo();
        } else if (action === 'pause') {
          playerRef.current.pauseVideo();
        }
      }
    });

    return () => { socket?.off('server_command'); socket?.off('room_state'); };
  }, [socket]);

  // Iframe API hazır olduğunda oynatıcıyı kur
  useEffect(() => {
    if (!isMounted || !videoUrl) return;

    const videoId = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/)?.[1];
    
    if (window.YT && window.YT.Player) {
      playerRef.current = new window.YT.Player('yt-player', {
        videoId: videoId,
        playerVars: { autoplay: 1, controls: isHost ? 1 : 0, origin: window.location.origin },
        events: {
          'onStateChange': (event) => {
            if (!isHost) return;
            const currentTime = playerRef.current.getCurrentTime();
            if (event.data === window.YT.PlayerState.PLAYING) {
              socket.emit('media_command', { partyId, action: 'play', time: currentTime });
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              socket.emit('media_command', { partyId, action: 'pause', time: currentTime });
            }
          }
        }
      });
    }
  }, [isMounted, videoUrl, isHost, partyId, socket]);

  if (!isMounted) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border-4 border-green-500 shadow-2xl h-[500px]">
      <div id="yt-player" className="w-full h-full"></div>
      {!isHost && <div className="absolute inset-0 z-50 bg-transparent cursor-not-allowed" />}
      {isHost && <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">BAŞKAN (HOST)</div>}
    </div>
  );
}