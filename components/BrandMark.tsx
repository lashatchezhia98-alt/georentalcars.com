"use client";

export default function BrandMark() {
  const playEngineRoar = () => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const lowPass = context.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 420;
    lowPass.Q.value = 1.4;
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.48, context.currentTime + 0.1);
    master.gain.setValueAtTime(0.42, context.currentTime + 1.05);
    master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 2.15);
    master.connect(lowPass).connect(compressor).connect(context.destination);

    [31, 46, 62].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 0 ? "sawtooth" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 2.05, context.currentTime + 1.18);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.2, context.currentTime + 2.1);
      gain.gain.value = 0.28 / (index + 1);
      oscillator.connect(gain).connect(master);
      oscillator.start();
      oscillator.stop(context.currentTime + 2.2);
    });

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2.2, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index++) noiseData[index] = Math.random() * 2 - 1;
    const exhaust = context.createBufferSource();
    const exhaustFilter = context.createBiquadFilter();
    const exhaustGain = context.createGain();
    exhaust.buffer = noiseBuffer;
    exhaustFilter.type = "lowpass";
    exhaustFilter.frequency.value = 155;
    exhaustGain.gain.setValueAtTime(0.16, context.currentTime);
    exhaustGain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 2.15);
    exhaust.connect(exhaustFilter).connect(exhaustGain).connect(master);
    exhaust.start();
    exhaust.stop(context.currentTime + 2.2);

    window.setTimeout(() => context.close(), 2400);
  };
  return <span className="offroad-mark" aria-label="Play Wrangler engine sound" role="button" onClick={playEngineRoar} />;
}
