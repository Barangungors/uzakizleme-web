// @ts-nocheck
"use client";
import React, { useEffect, useRef, useState } from 'react';

export default function ScreenShare({ socket, partyId }) {
  const [isSharing, setIsSharing] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // WebRTC Ayarları (Google'ın ücretsiz STUN sunucuları, tünel kazmak için)
  const servers = {
    iceServers: [
      { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ]
  };

  useEffect(() => {
    if (!socket) return;

    // 1. Birisi Ekran Paylaşmak İstiyor (Teklif Geldi)
    socket.on('webrtc_offer', async ({ offer, senderId }) => {
      setIsReceiving(true);
      const pc = new RTCPeerConnection(servers);
      peerConnection.current = pc;

      // Karşı tarafın ekranı gelince videoya bas
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit('webrtc_ice', { partyId, candidate: event.candidate });
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('webrtc_answer', { partyId, answer }); // Cevabı gönder
    });

    // 2. Karşı Taraf Teklifimizi Kabul Etti (Cevap Geldi)
    socket.on('webrtc_answer', async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // 3. Tünel Kazma İşlemi (ICE Candidates)
    socket.on('webrtc_ice', async ({ candidate }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice');
    };
  }, [socket, partyId]);

  // EKRAN PAYLAŞMA BUTONUNA BASILINCA ÇALIŞACAK FONKSİYON
  const startScreenShare = async () => {
    try {
      // Tarayıcıdan ekran kaydı izni iste
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setIsSharing(true);
      
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(servers);
      peerConnection.current = pc;

      // Ekranımın verisini tünele ekle
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit('webrtc_ice', { partyId, candidate: event.candidate });
      };

      // Odadakilere teklif gönder
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { partyId, offer });

      // Paylaşım durdurulursa her şeyi temizle
      stream.getVideoTracks()[0].onended = () => {
        setIsSharing(false);
        pc.close();
      };
    } catch (err) {
      console.error("Ekran paylaşımı reddedildi veya hata:", err);
    }
  };

  return (
    <div className="w-full bg-gray-900 rounded-2xl border border-gray-800 p-4 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold text-lg">💻 Canlı Ekran Yayını</h3>
        {!isSharing && !isReceiving && (
          <button onClick={startScreenShare} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition">
            Ekranımı Paylaş (Go Live)
          </button>
        )}
        {isSharing && <span className="text-green-500 font-bold animate-pulse">🔴 Yayındasın</span>}
        {isReceiving && <span className="text-blue-500 font-bold animate-pulse">📺 Yayın İzleniyor</span>}
      </div>

      {/* Ekran Videolarının Görüneceği Alan */}
      {(isSharing || isReceiving) && (
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-purple-500/50">
          <video 
            ref={isSharing ? localVideoRef : remoteVideoRef} 
            autoPlay 
            playsInline 
            muted={isSharing} // Kendi sesimi kendim duymayayım
            className="w-full h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}