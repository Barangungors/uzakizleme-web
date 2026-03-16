// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Socket } from 'socket.io-client';

export default function WatchPartyPlayer({ socket, videoUrl, isHost, partyId }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border-4 border-red-500">
      <ReactPlayer
        url={videoUrl}
        width="100%"
        height="100%"
        controls={true}
      />
    </div>
  );
}