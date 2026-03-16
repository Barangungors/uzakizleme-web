// @ts-nocheck
"use client";
import React from 'react';
import dynamic from 'next/dynamic';

// 🚀 İŞTE YOUTUBE'U ENGELLEYEN DUVARI YIKAN KOD
// Next.js'e "Bunu sadece tarayıcıda çalıştır" diyoruz (ssr: false)
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export default function WatchPartyPlayer({ socket, videoUrl, isHost, partyId }) {
  return (
    // Çerçeveyi YEŞİL yaptık. Yeşil yanınca YouTube gelecek!
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border-4 border-green-500">
      <ReactPlayer
        url={videoUrl}
        width="100%"
        height="100%"
        controls={true}
      />
    </div>
  );
}