import React, { useRef, useState } from 'react';
import { useVideoSync } from '../hooks/useVideoSync';
import { Socket } from 'socket.io-client';

interface PlayerProps {
  socket: Socket | null;
  videoUrl: string;
  isHost: boolean;
  partyId: string;
}

export default function WatchPartyPlayer({ socket, videoUrl, isHost, partyId }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useVideoSync(videoRef, socket, isHost);

  const handleHostAction = (action: 'PLAY' | 'PAUSE' | 'SEEK') => {
    if (!isHost || !socket || !videoRef.current) return;
    socket.emit('host_action', { partyId, action, videoTime: videoRef.current.currentTime });
  };

  return (
    <div 
      className="relative w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black group transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video object-contain"
        onPlay={() => handleHostAction('PLAY')}
        onPause={() => handleHostAction('PAUSE')}
        onSeeked={() => handleHostAction('SEEK')}
        controls={isHost}
        disablePictureInPicture
      />
      {!isHost && (
        <div className="absolute inset-0 z-10 bg-transparent flex items-end p-4">
          <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <span className="bg-black/70 text-white text-sm px-3 py-1 rounded-full backdrop-blur-md">
              Senkronize ediliyor...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}