import { useEffect, RefObject } from 'react';
import { Socket } from 'socket.io-client';

interface SyncState {
  isPlaying: boolean;
  videoTime: number;
  lastUpdateEpoch: number;
}

export function useVideoSync(videoRef: RefObject<HTMLVideoElement | null>, socket: Socket | null, isHost: boolean) {
  useEffect(() => {
    if (!socket || !videoRef.current || isHost) return;

    const video = videoRef.current;

    const handleSync = (state: SyncState) => {
      const now = Date.now();
      const expectedTime = state.videoTime + (now - state.lastUpdateEpoch) / 1000;
      const drift = expectedTime - video.currentTime;

      if (state.isPlaying && video.paused) video.play().catch(console.error);
      else if (!state.isPlaying && !video.paused) {
        video.pause();
        video.currentTime = state.videoTime;
      }

      if (state.isPlaying) {
        if (Math.abs(drift) > 2) video.currentTime = expectedTime;
        else if (drift > 0.05) video.playbackRate = 1.05; 
        else if (drift < -0.05) video.playbackRate = 0.95;
        else video.playbackRate = 1.0;
      }
    };

    socket.on('sync_update', handleSync);
    return () => { socket.off('sync_update', handleSync); video.playbackRate = 1.0; };
  }, [socket, videoRef, isHost]);
}