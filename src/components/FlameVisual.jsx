export default function FlameVisual({ state }) {
  return (
    <div className={`flameVisual visualState-${state}`} aria-hidden="true">
      <svg className="flameSvg" viewBox="0 0 320 320">
        <defs>
          <radialGradient id="flameBaseGlow" cx="50%" cy="78%" r="42%">
            <stop offset="0%" stopColor="#fff1b8" stopOpacity="0.95" />
            <stop offset="28%" stopColor="#ffb338" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#ff8c18" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="flameRibbonGold" x1="30%" y1="0%" x2="76%" y2="100%">
            <stop offset="0%" stopColor="#fff2bc" />
            <stop offset="38%" stopColor="#ffbd3d" />
            <stop offset="78%" stopColor="#f06d12" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b1302" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flameRibbonLight" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fff8dc" />
            <stop offset="48%" stopColor="#ffd071" />
            <stop offset="100%" stopColor="#ff9b1e" stopOpacity="0.18" />
          </linearGradient>
          <filter id="flameGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse className="flameBaseLight" cx="160" cy="256" rx="74" ry="28" />
        <g className="flameRibbons" filter="url(#flameGlow)">
          <path className="flameRibbon ribbonBack" d="M139 263 C89 218 119 181 113 146 C107 108 133 83 158 50 C143 106 188 125 181 166 C174 205 146 217 139 263 Z" />
          <path className="flameRibbon ribbonLeft" d="M160 264 C106 229 121 184 144 151 C164 122 143 88 174 31 C174 87 219 119 198 168 C184 202 164 221 160 264 Z" />
          <path className="flameRibbon ribbonRight" d="M170 264 C224 229 222 184 195 149 C177 125 184 90 209 59 C204 112 248 147 221 206 C208 236 190 250 170 264 Z" />
          <path className="flameRibbon ribbonCore" d="M158 264 C132 223 150 190 170 164 C190 138 178 113 191 84 C216 145 208 210 158 264 Z" />
          <path className="flameRibbon ribbonWhite" d="M156 255 C144 218 159 193 175 173 C191 153 186 134 193 113 C208 168 194 225 156 255 Z" />
          <path className="flameRibbon ribbonOuterLeft" d="M126 263 C88 226 101 192 123 167 C143 143 130 111 149 76 C151 123 178 148 160 185 C145 216 130 235 126 263 Z" />
          <path className="flameRibbon ribbonOuterRight" d="M202 260 C240 221 233 188 211 163 C194 143 204 112 224 91 C219 137 254 174 232 220 C222 240 211 253 202 260 Z" />
          <path className="flameRibbon ribbonInnerGold" d="M166 262 C145 230 155 205 178 180 C198 158 195 135 201 115 C224 177 211 230 166 262 Z" />
          <path className="flameWhisper whisperOne" d="M123 245 C143 214 126 190 143 159 C155 137 162 122 156 91" />
          <path className="flameWhisper whisperTwo" d="M190 245 C216 213 206 182 188 153 C176 132 184 103 203 78" />
          <path className="flameWhisper whisperThree" d="M151 254 C181 215 179 188 165 163 C150 135 167 109 181 82" />
          <path className="flameWhisper whisperFour" d="M172 255 C146 221 158 199 179 175 C201 150 194 128 187 105" />
          <path className="flameWhisper whisperFive" d="M139 250 C112 218 119 190 134 164 C150 136 144 117 138 96" />
          <path className="flameWhisper whisperSix" d="M205 240 C184 213 191 192 207 172 C225 150 221 128 213 105" />
        </g>
      </svg>
      <span className="flameAura" />
      <span className="emberRing ringBack" />
      <span className="emberRing ringMiddle" />
      <span className="emberRing ringFront" />
      {Array.from({ length: 40 }).map((_, index) => (
        <span
          key={index}
          className="ember"
          style={{
            '--ember-index': index,
            '--ember-angle': `${index * 13 + (index % 4) * 9}deg`,
            '--ember-radius': `${35 + (index % 8) * 12}px`,
          }}
        />
      ))}
    </div>
  );
}
