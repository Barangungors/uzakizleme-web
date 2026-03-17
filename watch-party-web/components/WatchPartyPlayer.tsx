// @ts-nocheck
"use client";
import React, { useEffect, useState, useRef } from 'react';

export default function WatchPartyPlayer({ socket, videoUrl, partyId }) {
  const [isHost, setIsHost] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // YouTube ID Çıkarma
    const id = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/)?.[1];
    setVideoId(id);

    if (socket) {
      socket.on('room_state', (data) => setIsHost(data.isHost));
    }
    return () => { socket?.off('room_state'); };
  }, [videoUrl, socket]);

  if (!isMounted || !videoId) return <div className="h-[450px] bg-black rounded-2xl flex items-center justify-center text-white">Hazırlanıyor...</div>;

  // 🚀 HATAYI ÇÖZEN SİHİRLİ URL YAPISI
  // 'origin' parametresini window.location.origin ile zorluyoruz
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&rel=0&origin=${currentOrigin}`;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border-4 border-green-500 shadow-2xl h-[450px]">
      <iframe
        id="main-player"
        width="100%"
        height="100%"
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ position: 'absolute', top: 0, left: 0 }}
      ></iframe>
      
      {/* Sadece sahip olmayanlar için tıklama engeli */}
      {!isHost && (
        <div className="absolute inset-0 z-50 bg-transparent cursor-not-allowed" />
      )}
    </div>
  );
}