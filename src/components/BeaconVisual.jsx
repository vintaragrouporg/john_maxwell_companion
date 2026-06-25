export default function BeaconVisual({ state }) {
  return (
    <div className={`beaconVisual visualState-${state}`} aria-hidden="true">
      <svg className="beaconSvg" viewBox="0 0 360 360">
        <defs>
          <radialGradient id="beaconBloom" cx="50%" cy="38%" r="58%">
            <stop offset="0%" stopColor="#fff5c8" stopOpacity="0.96" />
            <stop offset="16%" stopColor="#ffd46f" stopOpacity="0.68" />
            <stop offset="46%" stopColor="#b87520" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#07151f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="beaconHaze" cx="50%" cy="58%" r="58%">
            <stop offset="0%" stopColor="#ffc65a" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#17354d" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#03070a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stopColor="#fff3c2" stopOpacity="0.52" />
            <stop offset="52%" stopColor="#d7c08a" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#d7c08a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="towerFace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#030303" />
            <stop offset="23%" stopColor="#11100e" />
            <stop offset="50%" stopColor="#5b3f1e" />
            <stop offset="72%" stopColor="#11100d" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
          <linearGradient id="rockFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#463114" stopOpacity="0.72" />
            <stop offset="52%" stopColor="#0c0b0a" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
          <linearGradient id="beamGold" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#fff2bd" stopOpacity="0.94" />
            <stop offset="28%" stopColor="#ffc45b" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#ffc45b" stopOpacity="0" />
          </linearGradient>
          <filter id="beaconSoftGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="beaconHeavyGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="14" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect className="beaconNight" width="360" height="360" />
        <circle className="beaconAtmosphere" cx="180" cy="154" r="168" />
        <g className="beaconGuides">
          {[54, 78, 103, 129, 156].map((radius) => (
            <circle key={radius} cx="180" cy="158" r={radius} />
          ))}
          <line x1="180" y1="0" x2="180" y2="316" />
          <line x1="42" y1="158" x2="318" y2="158" />
        </g>

        <g className="beaconBeams" filter="url(#beaconHeavyGlow)">
          <path className="beaconBeam beamWideLeft" d="M180 132 L-86 70 L-86 204 Z" />
          <path className="beaconBeam beamWideRight" d="M180 132 L378 72 L378 198 Z" />
          <path className="beaconBeam beamHighLeft" d="M180 130 L-94 32 L-94 112 Z" />
          <path className="beaconBeam beamHighRight" d="M180 130 L352 26 L370 92 Z" />
          <path className="beaconBeam beaconBeamLowLeft" d="M180 139 L-16 220 L-10 280 Z" />
          <path className="beaconBeam beaconBeamLowRight" d="M180 139 L376 220 L370 280 Z" />
        </g>

        <circle className="beaconLightBloom" cx="180" cy="133" r="104" />
        <circle className="beaconCoreBloom" cx="180" cy="132" r="42" />
        <ellipse className="beaconLanternHalo" cx="180" cy="137" rx="78" ry="34" />
        <path className="beaconFresnelBand" d="M85 137 C122 128 151 126 180 130 C209 126 238 128 275 137 C238 146 209 148 180 144 C151 148 122 146 85 137 Z" />
        <circle className="beaconMoon" cx="230" cy="226" r="28" />

        <g className="beaconIsland">
          <ellipse className="islandGlow" cx="180" cy="288" rx="112" ry="28" />
          <path className="islandBack" d="M55 301 C79 274 97 276 120 254 C139 237 154 260 174 238 C193 260 210 241 231 258 C253 276 280 273 306 301 Z" />
          <path className="islandFront" d="M32 315 C58 290 86 294 111 273 C135 254 151 279 175 254 C198 279 219 255 246 277 C271 297 304 288 328 315 Z" />
          <g className="waterReflections">
            <path d="M104 324 C142 316 214 316 256 324" />
            <path d="M125 336 C150 330 210 330 235 336" />
            <path d="M143 346 C160 342 199 342 217 346" />
          </g>
        </g>

        <g className="lighthouse" filter="url(#beaconSoftGlow)">
          <path className="towerShadow" d="M146 288 C151 242 157 198 165 156 L195 156 C203 198 209 242 214 288 Z" />
          <path className="towerBody" d="M150 288 C154 240 160 198 167 156 L193 156 C200 198 206 240 210 288 Z" />
          <path className="towerCenterHighlight" d="M174 158 C171 196 169 238 168 287 L188 287 C187 238 185 196 182 158 Z" />
          <path className="towerLeftEdge" d="M167 156 L175 156 C172 203 169 248 168 288 L150 288 C154 240 160 198 167 156 Z" />
          <path className="towerRightEdge" d="M193 156 L185 156 C188 203 191 248 192 288 L210 288 C206 240 200 198 193 156 Z" />
          <g className="towerBands">
            <path d="M162 188 C173 191 187 191 198 188" />
            <path d="M158 220 C173 224 187 224 202 220" />
            <path d="M154 254 C172 259 188 259 206 254" />
          </g>
          <path className="galleryDeck" d="M153 151 L207 151 L202 161 L158 161 Z" />
          <g className="galleryRails">
            <line x1="156" y1="145" x2="204" y2="145" />
            <line x1="160" y1="145" x2="160" y2="155" />
            <line x1="173" y1="145" x2="173" y2="155" />
            <line x1="187" y1="145" x2="187" y2="155" />
            <line x1="200" y1="145" x2="200" y2="155" />
          </g>
          <path className="lanternRoom" d="M164 122 L196 122 L203 151 L157 151 Z" />
          <path className="lanternGlass" d="M168 127 L192 127 L197 148 L163 148 Z" />
          <path className="lanternFrame" d="M168 127 L163 148 M180 126 L180 149 M192 127 L197 148" />
          <path className="roof" d="M160 122 L180 108 L200 122 Z" />
          <path className="spire" d="M178.4 108 L180 78 L181.6 108 Z" />
          <rect className="towerWindow windowTop" x="175" y="190" width="10" height="18" rx="2" />
          <rect className="towerWindow windowMid" x="173" y="232" width="14" height="23" rx="2" />
          <path className="towerBase" d="M132 288 L228 288 L242 306 L118 306 Z" />
        </g>

        <g className="beaconParticles">
          {Array.from({ length: 38 }).map((_, index) => (
            <circle
              key={index}
              cx={70 + ((index * 47) % 220)}
              cy={58 + ((index * 73) % 210)}
              r={index % 7 === 0 ? 1.7 : 0.9}
              style={{ '--particle-index': index }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
