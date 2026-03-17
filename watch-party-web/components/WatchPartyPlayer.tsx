// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

export default function WatchPartyPlayer({ socket, videoUrl, partyId }) {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('play', (time) => {
      setPlaying(true);
      playerRef.current?.seekTo(time, 'seconds');
    });

    socket.on('pause', (time) => {
      setPlaying(false);
      playerRef.current?.seekTo(time, 'seconds');
    });

    return () => {
      socket.off('play'); socket.off('pause');
    };
  }, [socket]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border-2 border-green-500 shadow-2xl">
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={playing}
        controls={true}
        onPlay={() => socket?.emit('play', { partyId, currentTime: playerRef.current?.getCurrentTime() })}
        onPause={() => socket?.emit('pause', { partyId, currentTime: playerRef.current?.getCurrentTime() })}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
}