const fs = require('fs');
const path = require('path');

const RATE = 44100;
const OUTPUT = path.join(__dirname, '..', 'assets', 'audio');

function envelope(t, duration, attack = 0.025, release = 0.16) {
  return Math.min(1, t / attack, (duration - t) / release);
}

function tone(freq, start, duration, volume, t, kind = 'sine') {
  const local = t - start;
  if (local < 0 || local > duration) return 0;
  const phase = 2 * Math.PI * freq * local;
  const wave = kind === 'wood'
    ? Math.sin(phase) * 0.7 + Math.sin(phase * 2.01) * 0.2 + Math.sin(phase * 3.03) * 0.1
    : Math.sin(phase);
  return wave * volume * Math.max(0, envelope(local, duration));
}

function noise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function writeWav(name, duration, sample) {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const count = Math.floor(RATE * duration);
  const pcm = Buffer.alloc(count * 2);
  for (let i = 0; i < count; i += 1) {
    const value = Math.max(-1, Math.min(1, sample(i / RATE, i)));
    pcm.writeInt16LE(Math.round(value * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(path.join(OUTPUT, name), Buffer.concat([header, pcm]));
}

const chords = [
  [146.83, 220, 293.66],
  [130.81, 196, 261.63],
  [110, 164.81, 220],
  [123.47, 185, 246.94],
];

writeWav('ambient-loop.wav', 16, (t) => {
  const chord = chords[Math.floor(t / 4) % chords.length];
  const local = t % 4;
  const crossfade = Math.min(1, local / 0.8, (4 - local) / 0.8);
  const pad = chord.reduce((sum, freq) => sum + Math.sin(2 * Math.PI * freq * t), 0) / 3;
  const shimmer = Math.sin(2 * Math.PI * chord[2] * 2 * t) * 0.018 * (0.5 + 0.5 * Math.sin(Math.PI * t / 2));
  return pad * 0.075 * crossfade + shimmer;
});

writeWav('tap.wav', 0.16, (t, i) => tone(520, 0, 0.13, 0.18, t, 'wood') + noise(i) * 0.025 * Math.max(0, 1 - t / 0.08));
writeWav('place.wav', 0.3, (t, i) => tone(178, 0, 0.2, 0.3, t, 'wood') + tone(285, 0.045, 0.2, 0.14, t, 'wood') + noise(i) * 0.026 * Math.max(0, 1 - t / 0.1));
writeWav('remove.wav', 0.22, (t, i) => tone(245 - t * 260, 0, 0.2, 0.16, t, 'wood') + noise(i) * 0.032 * Math.sin(Math.PI * t / 0.22));
writeWav('connect.wav', 0.48, (t) => tone(330, 0, 0.22, 0.23, t, 'wood') + tone(494, 0.09, 0.3, 0.2, t) + tone(659, 0.19, 0.25, 0.13, t));
writeWav('success.wav', 1.35, (t) => tone(392, 0, 0.5, 0.2, t) + tone(523.25, 0.22, 0.58, 0.22, t) + tone(659.25, 0.47, 0.72, 0.24, t) + tone(783.99, 0.72, 0.58, 0.15, t));
writeWav('star.wav', 0.62, (t) => tone(880, 0, 0.3, 0.16, t) + tone(1318.51, 0.08, 0.42, 0.18, t) + tone(1760, 0.18, 0.36, 0.09, t));
writeWav('whoosh.wav', 0.62, (t, i) => {
  const shape = Math.sin(Math.PI * t / 0.62);
  const sweep = Math.sin(2 * Math.PI * (120 + 680 * t) * t) * 0.06;
  return noise(i) * 0.12 * shape + sweep * shape;
});

console.log('Original game audio generated in assets/audio.');
