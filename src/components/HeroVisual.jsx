import { useEffect, useState } from 'react';

const assetBySkin = {
  beacon: '/assets/skins/lighthouse-hero.png',
  circle: '/assets/skins/circle-hero.png',
  flame: '/assets/skins/flame-hero.png',
  compass: '/assets/skins/compass-hero.png',
};

export default function HeroVisual({ skin, state, transition, isPressed, FallbackVisual }) {
  const assetSrc = assetBySkin[skin.id];
  const [assetStatus, setAssetStatus] = useState('pending');

  useEffect(() => {
    setAssetStatus('pending');
  }, [assetSrc]);

  return (
    <div
      className={`heroVisual heroVisual-${skin.id} heroState-${state} ${
        transition ? `heroTransition-${transition}` : ''
      } ${isPressed ? 'isHeroPressed' : ''}`}
      data-asset-status={assetStatus}
      data-voice-transition={transition ?? 'none'}
      aria-hidden="true"
    >
      <div className="heroAtmosphereLayer" />
      <div className="heroGlowLayer" />
      <div className="heroMotionLayer">
        <div className="heroAssetLayer">
          {assetSrc && assetStatus !== 'missing' && (
            <img
              className={`heroAsset ${assetStatus === 'loaded' ? 'isLoaded' : ''}`}
              src={assetSrc}
              alt=""
              draggable="false"
              onLoad={() => setAssetStatus('loaded')}
              onError={() => setAssetStatus('missing')}
            />
          )}
          {assetStatus !== 'loaded' && <FallbackVisual state={state} />}
        </div>
      </div>
      <div className="heroParticleLayer">
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            key={index}
            style={{
              '--hero-particle-index': index,
              '--hero-particle-angle': `${index * 15 + (index % 4) * 7}deg`,
              '--hero-particle-radius': `${84 + (index % 8) * 12}px`,
              '--hero-particle-size': `${index % 6 === 0 ? 3 : 2}px`,
              '--hero-particle-x': `${(index % 7 - 3) * 9}px`,
              '--hero-particle-y': `${18 + (index % 6) * 12}px`,
              '--hero-particle-left': `${18 + (index % 9) * 8}%`,
              '--hero-particle-top': `${22 + (index % 8) * 6}%`,
            }}
          />
        ))}
      </div>
      <div className="heroStateLayer" />
    </div>
  );
}
