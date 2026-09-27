export function RetroMacIllustration({ className = "w-72 h-72" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Retro Mac and Ink Pen illustration"
    >
      {/* Background Ink Droplets & Sparkles */}
      <circle cx="170" cy="42" r="3" fill="#000000" />
      <circle cx="152" cy="72" r="2.5" fill="#000000" />
      <circle cx="270" cy="115" r="3" fill="#000000" />
      <circle cx="140" cy="135" r="2" fill="#000000" />
      
      {/* Decorative sparkle 1 */}
      <path d="M165 30 L165 38 M161 34 L169 34" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
      {/* Decorative sparkle 2 */}
      <path d="M280 85 L280 93 M276 89 L284 89" stroke="#000000" strokeWidth="2" strokeLinecap="round" />

      {/* RETRO MACINTOSH COMPUTER */}
      {/* Main Body Shadow */}
      <rect x="180" y="80" width="105" height="135" rx="8" fill="#000000" />
      {/* Main Body Outer */}
      <rect x="175" y="75" width="105" height="135" rx="8" fill="#ffffff" stroke="#000000" strokeWidth="3" />
      
      {/* Beveled Top Edge */}
      <line x1="175" y1="88" x2="280" y2="88" stroke="#000000" strokeWidth="1.5" />
      
      {/* Bezel / Screen Recess */}
      <rect x="188" y="96" width="78" height="66" rx="6" fill="#000000" />
      <rect x="190" y="98" width="74" height="62" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="2" />
      
      {/* Screen Face: Friendly Retro Mac Face */}
      {/* Big Friendly Cyclops Eye / Scanner Lens */}
      <ellipse cx="227" cy="120" rx="14" ry="12" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
      <circle cx="227" cy="120" r="7" fill="#000000" />
      <circle cx="225" cy="117" r="2.5" fill="#ffffff" />
      {/* Retro Smile */}
      <path d="M214 138 C220 148, 234 148, 240 138" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
      <path d="M217 143 C222 149, 232 149, 237 143" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />

      {/* Floppy Drive Slot */}
      <rect x="190" y="174" width="46" height="4.5" rx="2" fill="#000000" />
      
      {/* Rainbow Apple / Retro Logo square on bottom left */}
      <rect x="254" y="171" width="10" height="10" rx="1.5" fill="#ffffff" stroke="#000000" strokeWidth="2" />
      <circle cx="259" cy="176" r="2" fill="#000000" />

      {/* Chin Vent Lines */}
      <line x1="184" y1="198" x2="271" y2="198" stroke="#000000" strokeWidth="2" />
      
      {/* Computer Base / Stand */}
      <polygon points="185,210 270,210 278,222 177,222" fill="#ffffff" stroke="#000000" strokeWidth="3" />
      <line x1="179" y1="222" x2="276" y2="222" stroke="#000000" strokeWidth="2" />
      
      {/* Keyboard */}
      <path d="M168 226 L265 226 L260 240 L162 240 Z" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
      {/* Keyboard keys stripes */}
      <line x1="172" y1="233" x2="255" y2="233" stroke="#000000" strokeWidth="1.5" strokeDasharray="3 2" />

      {/* Mouse & Cord */}
      <rect x="274" y="226" width="18" height="14" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="2" />
      <line x1="283" y1="226" x2="283" y2="233" stroke="#000000" strokeWidth="1.5" />
      {/* Cord curlicue */}
      <path d="M283 226 C287 215, 298 212, 292 200 C288 190, 275 195, 280 185" stroke="#000000" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* INK FOUNTAIN PEN & HAND */}
      {/* Ink Fountain Pen Nib */}
      {/* Pen Tip Point */}
      <path
        d="M105 52 L120 85 L120 120 L90 120 L90 85 Z"
        fill="#ffffff"
        stroke="#000000"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Pen Nib Slit & Breather Hole */}
      <line x1="105" y1="52" x2="105" y2="92" stroke="#000000" strokeWidth="2.5" />
      <circle cx="105" cy="94" r="3.5" fill="#000000" />
      {/* Pen Nib Wings / Flourish */}
      <path d="M96 90 C101 98, 109 98, 114 90" stroke="#000000" strokeWidth="2" fill="none" />
      
      {/* Pen Barrel / Collar */}
      <rect x="88" y="120" width="34" height="18" rx="2" fill="#000000" />
      <rect x="91" y="138" width="28" height="42" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
      <line x1="91" y1="152" x2="119" y2="152" stroke="#000000" strokeWidth="2" />
      <line x1="91" y1="166" x2="119" y2="166" stroke="#000000" strokeWidth="2" />

      {/* Hand Gripping the Pen (Stylized Retro Cartoon Hand) */}
      {/* Thumb */}
      <path
        d="M74 158 C74 150, 84 148, 92 153 C96 156, 96 168, 90 172 C82 176, 74 168, 74 158 Z"
        fill="#ffffff"
        stroke="#000000"
        strokeWidth="2.5"
      />
      {/* Fingers wrap around barrel */}
      {/* Index Finger */}
      <rect x="110" y="142" width="26" height="12" rx="6" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
      {/* Middle Finger */}
      <rect x="110" y="154" width="28" height="12" rx="6" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
      {/* Ring Finger */}
      <rect x="110" y="166" width="26" height="12" rx="6" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
      {/* Pinky Finger */}
      <rect x="108" y="178" width="24" height="12" rx="6" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
      
      {/* Hand Palm / Wrist */}
      <path
        d="M84 172 L78 220 L115 220 L124 185"
        fill="#ffffff"
        stroke="#000000"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Wrist cuff */}
      <rect x="73" y="218" width="46" height="10" rx="3" fill="#000000" />
      <rect x="70" y="228" width="52" height="18" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
      {/* Cufflink */}
      <circle cx="108" cy="237" r="3" fill="#000000" />

      {/* Retro Ink Hatch Lines on Hand */}
      <line x1="84" y1="190" x2="94" y2="190" stroke="#000000" strokeWidth="1.5" />
      <line x1="86" y1="196" x2="98" y2="196" stroke="#000000" strokeWidth="1.5" />
      <line x1="88" y1="202" x2="102" y2="202" stroke="#000000" strokeWidth="1.5" />
    </svg>
  );
}
