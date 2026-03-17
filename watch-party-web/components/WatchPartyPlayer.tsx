// @ts-nocheck
"use client";
import React, { useEffect, useState, useRef } from 'react';

export default function WatchPartyPlayer({ socket, videoUrl, partyId, setVideoUrl }) {
  const [videoId, setVideoId] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [hostId, setHostId] = useState("");

  useEffect(() => {
    setIsMounted(true);
    
    // YouTube ID Çıkarma
    const extractId = (url) => url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/)?.[1];
    setVideoId(extractId(videoUrl));

    if (socket) {
      socket.on('room_state', (data) => {
        setVideoUrl(data.videoUrl);
        setHostId(data.hostId);
      });
      socket.on('video_changed', (data) => {
        setVideoUrl(data.videoUrl);
        setHostId(data.hostId);
      });
    }
    return () => { socket?.off('room_state'); socket?.off('video_changed'); };
  }, [videoUrl, socket, setVideoUrl]);

  if (!isMounted || !videoId) return <div className="h-[450px] bg-black rounded-2xl flex items-center justify-center text-white">Hazırlanıyor...</div>;

  const isHost = socket?.id === hostId;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border-4 border-green-500 shadow-2xl" style={{ height: '500px' }}>
      <iframe
        width="100%" height="100%"
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&origin=${window.location.origin}`}
        frameBorder="0"
        allow="autoplay; encrypted-media"
      ></iframe>
      
      {/* BAŞKAN DEĞİLSEN ÜZERİNDE BİR UYARI VE ENGEL OLUR */}
      {!isHost && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-50">
          ⚠️ Sadece Oda Sahibi Kontrol Edebilir
        </div>
      )}
      {!isHost && <div className="absolute inset-0 z-40 bg-transparent cursor-not-allowed" />}
    </div>
  );
}