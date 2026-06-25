export default function CompassVisual({ state }) {
  return (
    <div className={`compassVisual visualState-${state}`} aria-hidden="true">
      <span className="compassGlass" />
      <span className="compassAura" />
      <svg className="compassSvg" viewBox="0 0 320 320" role="img">
        <defs>
          <radialGradient id="compassCenterGlow" cx="50%" cy="50%" r="58%">
            <stop offset="0%" stopColor="#fff7d1" />
            <stop offset="22%" stopColor="#ffd66f" stopOpacity="0.95" />
            <stop offset="54%" stopColor="#b7701d" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#041420" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="compassGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff2be" />
            <stop offset="44%" stopColor="#ffc45a" />
            <stop offset="100%" stopColor="#65400f" />
          </linearGradient>
          <linearGradient id="compassDarkGold" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffc95e" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#261506" stopOpacity="0.96" />
          </linearGradient>
          <filter id="compassGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle className="compassMist" cx="160" cy="160" r="118" />
        <circle className="compassGuideRing guideA" cx="160" cy="160" r="124" />
        <circle className="compassGuideRing guideB" cx="160" cy="160" r="99" />
        <circle className="compassGuideRing guideC" cx="160" cy="160" r="70" />
        <circle className="compassTickRing" cx="160" cy="160" r="112" />
        <g className="compassRadials">
          {Array.from({ length: 32 }).map((_, index) => (
            <line
              key={index}
              x1="160"
              y1={index % 4 === 0 ? 42 : 48}
              x2="160"
              y2={index % 4 === 0 ? 58 : 55}
              transform={`rotate(${index * 11.25} 160 160)`}
            />
          ))}
        </g>
        <g className="compassAxis">
          <line x1="160" y1="35" x2="160" y2="285" />
          <line x1="35" y1="160" x2="285" y2="160" />
          <line x1="72" y1="72" x2="248" y2="248" />
          <line x1="248" y1="72" x2="72" y2="248" />
        </g>
        <g className="compassRose" filter="url(#compassGlow)">
          <path className="majorNeedle north" d="M160 34 L168 148 L160 160 L152 148 Z" />
          <path className="majorNeedle east" d="M286 160 L172 168 L160 160 L172 152 Z" />
          <path className="majorNeedle south" d="M160 286 L152 172 L160 160 L168 172 Z" />
          <path className="majorNeedle west" d="M34 160 L148 152 L160 160 L148 168 Z" />
          <path className="minorNeedle" d="M160 76 L176 139 L160 160 L144 139 Z" transform="rotate(45 160 160)" />
          <path className="minorNeedle" d="M160 76 L176 139 L160 160 L144 139 Z" transform="rotate(135 160 160)" />
          <path className="minorNeedle" d="M160 76 L176 139 L160 160 L144 139 Z" transform="rotate(225 160 160)" />
          <path className="minorNeedle" d="M160 76 L176 139 L160 160 L144 139 Z" transform="rotate(315 160 160)" />
        </g>
        <circle className="compassCenterGlow" cx="160" cy="160" r="62" />
        <circle className="compassCenterDot" cx="160" cy="160" r="9" />
      </svg>
      {Array.from({ length: 24 }).map((_, index) => (
        <span
          key={index}
          className="compassParticle"
          style={{
            '--compass-particle-index': index,
            '--compass-particle-angle': `${index * 15 + (index % 5) * 4}deg`,
            '--compass-particle-radius': `${95 + (index % 6) * 13}px`,
          }}
        />
      ))}
      <span className="cardinal cardinalN">N</span>
      <span className="cardinal cardinalE">E</span>
      <span className="cardinal cardinalS">S</span>
      <span className="cardinal cardinalW">W</span>
    </div>
  );
}
