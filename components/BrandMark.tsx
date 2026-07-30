"use client";

export default function BrandMark() {
  const playEngineRoar = () => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.32, context.currentTime + 0.08);
    master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.65);
    master.connect(context.destination);
    [42, 63, 87].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 0 ? "sawtooth" : "square";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 2.7, context.currentTime + 0.95);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.4, context.currentTime + 1.6);
      gain.gain.value = 0.22 / (index + 1);
      oscillator.connect(gain).connect(master);
      oscillator.start();
      oscillator.stop(context.currentTime + 1.7);
    });
    window.setTimeout(() => context.close(), 1900);
  };
  return <span className="offroad-mark" aria-label="Play Wrangler engine sound" role="button" onClick={playEngineRoar} />;
}
