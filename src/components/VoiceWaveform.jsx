const bars = [8, 14, 22, 31, 42, 56, 73, 51, 39, 28, 19, 12];

export default function VoiceWaveform({ skin, state }) {
  return (
    <div className={`voiceWaveform waveform-${skin} waveformState-${state}`} aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={`${height}-${index}`}
          style={{ '--bar-height': `${height}%`, '--bar-index': index }}
        />
      ))}
    </div>
  );
}
