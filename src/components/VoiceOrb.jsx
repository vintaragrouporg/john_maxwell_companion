export default function VoiceOrb({ state }) {
  return (
    <div className={`orbVisual visualState-${state}`} aria-hidden="true">
      <span className="orbDepth" />
      <span className="orbGuide guideOuter" />
      <span className="orbGuide guideInner" />
      <span className="orbHalo haloOne" />
      <span className="orbHalo haloTwo" />
      <span className="orbHalo haloThree" />
      <span className="orbTrail trailOne" />
      <span className="orbTrail trailTwo" />
      <span className="orbTrail trailThree" />
      <span className="orbTrail trailFour" />
      <span className="orbTrail trailFive" />
      <span className="orbTrail trailSix" />
      <span className="orbPulse pulseOne" />
      <span className="orbPulse pulseTwo" />
      <span className="orbEqualizer" />
      <span className="orbCore" />
      {Array.from({ length: 44 }).map((_, index) => (
        <span
          key={index}
          className="spark"
          style={{
            '--spark-index': index,
            '--spark-angle': `${index * 8.18 + (index % 3) * 5}deg`,
            '--spark-radius': `${88 + (index % 9) * 8}px`,
            '--spark-size': `${index % 7 === 0 ? 4 : index % 3 === 0 ? 3 : 2}px`,
          }}
        />
      ))}
    </div>
  );
}
