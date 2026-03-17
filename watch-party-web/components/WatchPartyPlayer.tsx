// @ts-nocheck
"use client";
import React, { useEffect, useState } from 'react';

export default function WatchPartyPlayer({ socket, videoUrl, partyId }) {
  const [videoId, setVideoId] = useState("");

  useEffect(() => {
    if (videoUrl) {
      const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/;
      const match = videoUrl.match(regExp);
      if (match && match[1]) {
        setVideoId(match[1]);
      }
    }
  }, [videoUrl]);

  if (!videoId) {
    return (
      <div className="w-full h-[450px] bg-gray-900 flex items-center justify-center text-white rounded-2xl border-4 border-green-500">
        ⏳ YouTube Linki Bekleniyor...
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border-4 border-green-500 shadow-2xl" style={{ height: '450px' }}>
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ position: 'absolute', top: 0, left: 0 }}
      ></iframe>
    </div>
  );
}