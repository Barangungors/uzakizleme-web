// @ts-nocheck
"use client";
import React, { useEffect, useRef, useState } from 'react';

export default function ScreenShare({ socket, partyId }) {
  const [isSharing, setIsSharing] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);

  // React State'leri: Görüntüleri havada kaybolmasın diye burada tutuyoruz
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

  // 🚀 SİHİRLİ DOKUNUŞ: Görüntü hafızaya geldiği an, video etiketine güvenle bağla
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

      // Görüntü geldiğinde doğrudan ekrana değil, hafızaya (State) al!
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
      setLocalStream(stream); // Kendi görüntümü hafızaya al
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

      // Ekran paylaşımı Chrome'dan durdurulursa her şeyi temizle
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
    <div className="w-full bg-gray-900 rounded-2xl border border-gray-800 p-4 mt-6 shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold text-lg">💻 Canlı Ekran Yayını</h3>
        {!isSharing && !isReceiving && (
          <button onClick={startScreenShare} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition duration-200">
            Ekranımı Paylaş (Go Live)
          </button>
        )}
        {isSharing && <span className="text-green-500 font-bold flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span> Yayındasın</span>}
        {isReceiving && <span className="text-blue-500 font-bold flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span> Yayın İzleniyor</span>}
      </div>

      {/* Ekran Videolarının Görüneceği Alan */}
      {(isSharing || isReceiving) && (
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border-2 border-purple-500/50 shadow-inner relative">
          
          {/* Eğer paylaşıyorsam kendi ekranımı göster */}
          {isSharing && (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
          )}

          {/* Eğer izliyorsam karşı tarafın ekranını göster */}
          {isReceiving && (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
          )}

        </div>
      )}
    </div>
  );
}