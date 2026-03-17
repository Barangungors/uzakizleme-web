// utils/sound.ts

export const playSound = (type: 'message' | 'join') => {
  try {
    // Tarayıcının ses motorunu başlat
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'message') {
      // 💬 TATLI BİR "POP" SESİ (Mesaj için)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime); // Ses seviyesi
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      
    } else if (type === 'join') {
      // 🔔 TATLI BİR "DİNG-DONG" SESİ (Odaya biri girince)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 Notası
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5 Notası
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05); // Yumuşak giriş
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); // Yumuşak çıkış
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.log("Ses çalınamadı:", e);
  }
};