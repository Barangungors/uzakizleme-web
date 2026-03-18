// @ts-nocheck
"use client";
import React, { useEffect, useRef, useState } from 'react';

export default function ScreenShare({ socket, partyId }) {
  const [isSharing, setIsSharing] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const servers = {
    iceServers: [
      { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ]
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isSharing]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isReceiving]);

  useEffect(() => {
    if (!socket) return;

    socket.on('webrtc_offer', async ({ offer }) => {
      setIsReceiving(true);
      const pc = new RTCPeerConnection(servers);
      peerConnection.current = pc;

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit('webrtc_ice', { partyId, candidate: event.candidate });
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('webrtc_answer', { partyId, answer });
    });

    socket.on('webrtc_answer', async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('webrtc_ice', async ({ candidate }) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Bağlantı pürüzü:", e);
        }
      }
    });

    return () => {
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice');
    };
  }, [socket, partyId]);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsSharing(true);

      const pc = new RTCPeerConnection(servers);
      peerConnection.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit('webrtc_ice', { partyId, candidate: event.candidate });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { partyId, offer });

      stream.getVideoTracks()[0].onended = () => {
        setIsSharing(false);
        setLocalStream(null);
        if (peerConnection.current) {
          peerConnection.current.close();
          peerConnection.current = null;
        }
      };
    } catch (err) {
      console.error("Ekran paylaşılamadı:", err);
    }
  };

  return (
    <div className="w-full bg-[#050510]/60 backdrop-blur-xl rounded-3xl border border-cyan-500/30 p-4 mt-6 shadow-2xl z-10">
      <div className="flex justify-between items-center mb-4 p-2">
        <h3 className="text-white font-bold text-lg flex items-center gap-3">
          <span className="text-cyan-400 text-xl">💻</span> Canlı Ekran Yayını
        </h3>
        {!isSharing && !isReceiving && (
          <button onClick={startScreenShare} className="bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition duration-200 text-sm uppercase tracking-widest">
            Yayını Başlat
          </button>
        )}
        {isSharing && <span className="text-green-400 font-bold flex items-center gap-2 text-sm uppercase tracking-widest"><span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span> Yayındasın</span>}
        {isReceiving && <span className="text-cyan-400 font-bold flex items-center gap-2 text-sm uppercase tracking-widest"><span className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]"></span> Yayın İzleniyor</span>}
      </div>

      {(isSharing || isReceiving) && (
        <div className="w-full aspect-video bg-black/60 rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-inner relative z-10">
          
          {isSharing && (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
          )}

          {isReceiving && (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
          )}

        </div>
      )}
    </div>
  );
}