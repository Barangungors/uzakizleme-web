// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic'; // YENİ: Dinamik import kütüphanesi
import { Socket } from 'socket.io-client';

// YENİ SİHİRLİ KOD: ReactPlayer'ı sadece tarayıcıda (Client) çalışacak şekilde yüklüyoruz.
// Bu sayede Next.js "onSeek" hatasını vermez ve sistem kilitlenmez.
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface PlayerProps {
  socket: Socket | null;
  videoUrl: string;
  isHost: boolean;
  partyId: string;
}

export default function WatchPartyPlayer({ socket, videoUrl, isHost, partyId }: PlayerProps) {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!socket || isHost || !isMounted) return;

    const handleSync = (state: any) => {
      const player = playerRef.current;
      if (!player) return;

      const now = Date.now();
      const expectedTime = state.videoTime + (now - state.lastUpdateEpoch) / 1000;
      const currentTime = player.getCurrentTime();
      const drift = expectedTime - currentTime;

      setIsPlaying(state.isPlaying);

      if (state.isPlaying) {
        if (Math.abs(drift) > 2) {
          player.seekTo(expectedTime, 'seconds');
        } else if (drift > 0.05) {
          setPlaybackRate(1.05); 
        } else if (drift < -0.05) {
          setPlaybackRate(0.95); 
        } else {
          setPlaybackRate(1.0);
        }
      } else {
        if (Math.abs(drift) > 0.5) player.seekTo(state.videoTime, 'seconds');
      }
    };

    socket.on('sync_update', handleSync);
    return () => { socket.off('sync_update', handleSync); };
  }, [socket, isHost, isMounted]);

  const handlePlay = () => {
    setIsPlaying(true);
    if (isHost && socket && playerRef.current) {
      socket.emit('host_action', { partyId, action: 'PLAY', videoTime: playerRef.current.getCurrentTime() });
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (isHost && socket && playerRef.current) {
      socket.emit('host_action', { partyId, action: 'PAUSE', videoTime: playerRef.current.getCurrentTime() });
    }
  };

  const handleSeek = (seconds: number) => {
    if (isHost && socket) {
      socket.emit('host_action', { partyId, action: 'SEEK', videoTime: seconds });
    }
  };

  if (!isMounted) {
    return <div className="w-full aspect-video rounded-2xl bg-black shadow-2xl border border-gray-800 flex items-center justify-center text-gray-500">Oynatıcı yükleniyor...</div>;
  }

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
   <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={isPlaying}
        controls={isHost} 
        playbackRate={playbackRate}
        onPlay={handlePlay}
        onPause={handlePause}
      />
      {!isHost && <div className="absolute inset-0 z-10 bg-transparent" />}
    </div>
  );
}