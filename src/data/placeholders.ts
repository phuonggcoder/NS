function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export const PLACEHOLDER_ART = {
  heroCreator: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 620" fill="none">
      <defs>
        <linearGradient id="bg1" x1="0" y1="0" x2="800" y2="620" gradientUnits="userSpaceOnUse">
          <stop stop-color="#EEF4FF"/>
          <stop offset="1" stop-color="#F5EEFF"/>
        </linearGradient>
        <linearGradient id="accent1" x1="120" y1="90" x2="660" y2="520" gradientUnits="userSpaceOnUse">
          <stop stop-color="#007AFF"/>
          <stop offset="1" stop-color="#5856D6"/>
        </linearGradient>
      </defs>
      <rect width="800" height="620" rx="32" fill="url(#bg1)"/>
      <circle cx="670" cy="110" r="110" fill="#007AFF" fill-opacity="0.12"/>
      <circle cx="130" cy="510" r="140" fill="#5856D6" fill-opacity="0.10"/>
      <rect x="76" y="72" width="648" height="476" rx="24" fill="#FFFFFF" stroke="#DCE5F2" stroke-width="2"/>
      <rect x="76" y="72" width="648" height="52" rx="24" fill="#F8FAFC"/>
      <circle cx="112" cy="98" r="7" fill="#FF5F57"/>
      <circle cx="136" cy="98" r="7" fill="#FEBC2E"/>
      <circle cx="160" cy="98" r="7" fill="#28C840"/>
      <rect x="240" y="88" width="320" height="20" rx="10" fill="#E9EEF5"/>
      <rect x="116" y="158" width="280" height="28" rx="8" fill="#0F172A" fill-opacity="0.08"/>
      <rect x="116" y="202" width="320" height="44" rx="10" fill="url(#accent1)"/>
      <rect x="116" y="264" width="260" height="16" rx="8" fill="#CBD5E1"/>
      <rect x="116" y="292" width="210" height="16" rx="8" fill="#E2E8F0"/>
      <rect x="116" y="336" width="142" height="44" rx="12" fill="#007AFF"/>
      <rect x="272" y="336" width="128" height="44" rx="12" fill="#F1F5F9" stroke="#CBD5E1"/>
      <rect x="468" y="156" width="216" height="332" rx="18" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
      <rect x="492" y="182" width="168" height="118" rx="12" fill="url(#accent1)" fill-opacity="0.16"/>
      <circle cx="576" cy="241" r="34" fill="url(#accent1)"/>
      <rect x="492" y="322" width="132" height="16" rx="8" fill="#1E293B" fill-opacity="0.22"/>
      <rect x="492" y="352" width="168" height="12" rx="6" fill="#CBD5E1"/>
      <rect x="492" y="376" width="142" height="12" rx="6" fill="#E2E8F0"/>
      <rect x="492" y="422" width="168" height="40" rx="10" fill="#111827"/>
    </svg>
  `),

  avatarCreator: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 600" fill="none">
      <defs>
        <linearGradient id="avBg" x1="0" y1="0" x2="560" y2="600" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E0ECFF"/>
          <stop offset="1" stop-color="#EDE9FE"/>
        </linearGradient>
        <linearGradient id="shirt" x1="140" y1="360" x2="420" y2="600" gradientUnits="userSpaceOnUse">
          <stop stop-color="#007AFF"/>
          <stop offset="1" stop-color="#5856D6"/>
        </linearGradient>
      </defs>
      <rect width="560" height="600" rx="32" fill="url(#avBg)"/>
      <circle cx="445" cy="115" r="76" fill="#007AFF" fill-opacity="0.14"/>
      <circle cx="115" cy="175" r="46" fill="#5856D6" fill-opacity="0.14"/>
      <path d="M120 600C120 462 191 390 280 390C369 390 440 462 440 600H120Z" fill="url(#shirt)"/>
      <circle cx="280" cy="245" r="96" fill="#FCD9BD"/>
      <path d="M184 232C184 166 226 126 284 126C344 126 378 168 376 232C358 198 326 184 282 184C236 184 204 202 184 232Z" fill="#1E293B"/>
      <circle cx="246" cy="248" r="8" fill="#1E293B"/>
      <circle cx="314" cy="248" r="8" fill="#1E293B"/>
      <path d="M254 290C268 302 292 302 306 290" stroke="#9A5B41" stroke-width="6" stroke-linecap="round"/>
      <rect x="46" y="458" width="210" height="72" rx="18" fill="#FFFFFF" fill-opacity="0.94"/>
      <circle cx="84" cy="494" r="18" fill="#34C759" fill-opacity="0.18"/>
      <path d="M76 494L82 500L93 488" stroke="#16A34A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="114" y="479" width="110" height="12" rx="6" fill="#0F172A" fill-opacity="0.75"/>
      <rect x="114" y="500" width="84" height="10" rx="5" fill="#64748B" fill-opacity="0.5"/>
    </svg>
  `),

  avatarConsultant: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 600" fill="none">
      <defs>
        <linearGradient id="cBg" x1="0" y1="0" x2="560" y2="600" gradientUnits="userSpaceOnUse">
          <stop stop-color="#13192B"/>
          <stop offset="1" stop-color="#1D2642"/>
        </linearGradient>
        <linearGradient id="cCoat" x1="120" y1="380" x2="440" y2="600" gradientUnits="userSpaceOnUse">
          <stop stop-color="#38BDF8"/>
          <stop offset="1" stop-color="#818CF8"/>
        </linearGradient>
      </defs>
      <rect width="560" height="600" rx="32" fill="url(#cBg)"/>
      <circle cx="430" cy="120" r="95" fill="#38BDF8" fill-opacity="0.16"/>
      <path d="M116 600C116 462 190 392 280 392C370 392 444 462 444 600H116Z" fill="url(#cCoat)"/>
      <path d="M174 235C174 158 218 114 280 114C342 114 386 158 386 235V330C386 355 368 370 350 370H210C192 370 174 355 174 330V235Z" fill="#0F172A"/>
      <circle cx="280" cy="248" r="88" fill="#FDE2CC"/>
      <path d="M192 224C212 178 248 162 288 162C332 162 356 184 368 224C340 198 308 192 276 196C240 200 214 210 192 224Z" fill="#0F172A"/>
      <circle cx="248" cy="252" r="7.5" fill="#0F172A"/>
      <circle cx="312" cy="252" r="7.5" fill="#0F172A"/>
      <path d="M256 290C270 301 290 301 304 290" stroke="#9A5B41" stroke-width="5.5" stroke-linecap="round"/>
    </svg>
  `),

  productUiKit: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" fill="none">
      <defs>
        <linearGradient id="p1" x1="0" y1="0" x2="640" y2="420" gradientUnits="userSpaceOnUse">
          <stop stop-color="#007AFF"/>
          <stop offset="1" stop-color="#5856D6"/>
        </linearGradient>
      </defs>
      <rect width="640" height="420" rx="24" fill="url(#p1)"/>
      <rect x="48" y="48" width="544" height="324" rx="18" fill="#FFFFFF" fill-opacity="0.96"/>
      <rect x="76" y="78" width="180" height="22" rx="8" fill="#007AFF" fill-opacity="0.14"/>
      <rect x="76" y="118" width="290" height="28" rx="8" fill="#0F172A" fill-opacity="0.85"/>
      <rect x="76" y="160" width="240" height="14" rx="7" fill="#94A3B8" fill-opacity="0.5"/>
      <rect x="76" y="210" width="150" height="126" rx="14" fill="#F1F5F9"/>
      <rect x="244" y="210" width="150" height="126" rx="14" fill="#EEF2FF"/>
      <rect x="412" y="210" width="150" height="126" rx="14" fill="#ECFDF5"/>
      <circle cx="151" cy="258" r="24" fill="#007AFF"/>
      <circle cx="319" cy="258" r="24" fill="#5856D6"/>
      <circle cx="487" cy="258" r="24" fill="#10B981"/>
    </svg>
  `),

  productCourse: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" fill="none">
      <defs>
        <linearGradient id="p2" x1="0" y1="0" x2="640" y2="420" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0EA5E9"/>
          <stop offset="1" stop-color="#2563EB"/>
        </linearGradient>
      </defs>
      <rect width="640" height="420" rx="24" fill="url(#p2)"/>
      <rect x="64" y="54" width="512" height="312" rx="20" fill="#0F172A"/>
      <circle cx="320" cy="196" r="46" fill="#FFFFFF" fill-opacity="0.16"/>
      <circle cx="320" cy="196" r="34" fill="#38BDF8"/>
      <path d="M310 180L338 196L310 212V180Z" fill="#0F172A"/>
      <rect x="108" y="294" width="424" height="10" rx="5" fill="#334155"/>
      <rect x="108" y="294" width="268" height="10" rx="5" fill="#38BDF8"/>
      <rect x="108" y="88" width="136" height="24" rx="12" fill="#1E293B"/>
    </svg>
  `),

  productMentorship: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" fill="none">
      <defs>
        <linearGradient id="p3" x1="0" y1="0" x2="640" y2="420" gradientUnits="userSpaceOnUse">
          <stop stop-color="#7C3AED"/>
          <stop offset="1" stop-color="#EC4899"/>
        </linearGradient>
      </defs>
      <rect width="640" height="420" rx="24" fill="url(#p3)"/>
      <rect x="68" y="62" width="240" height="296" rx="20" fill="#FFFFFF"/>
      <rect x="332" y="62" width="240" height="296" rx="20" fill="#FFF1F2"/>
      <circle cx="188" cy="156" r="42" fill="#EDE9FE"/>
      <rect x="116" y="224" width="144" height="18" rx="9" fill="#1E293B" fill-opacity="0.8"/>
      <rect x="132" y="256" width="112" height="12" rx="6" fill="#94A3B8"/>
      <rect x="120" y="294" width="136" height="36" rx="10" fill="#7C3AED"/>
      <circle cx="452" cy="156" r="42" fill="#FCE7F3"/>
      <rect x="380" y="224" width="144" height="18" rx="9" fill="#1E293B" fill-opacity="0.8"/>
      <rect x="396" y="256" width="112" height="12" rx="6" fill="#94A3B8"/>
      <rect x="384" y="294" width="136" height="36" rx="10" fill="#DB2777"/>
    </svg>
  `),

  heroProduct: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 620" fill="none">
      <defs>
        <linearGradient id="hp1" x1="0" y1="0" x2="800" y2="620" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FAF3E8"/>
          <stop offset="1" stop-color="#EFE2D0"/>
        </linearGradient>
        <linearGradient id="bag1" x1="250" y1="120" x2="550" y2="520" gradientUnits="userSpaceOnUse">
          <stop stop-color="#C2410C"/>
          <stop offset="1" stop-color="#9A3412"/>
        </linearGradient>
      </defs>
      <rect width="800" height="620" rx="32" fill="url(#hp1)"/>
      <circle cx="400" cy="310" r="210" fill="#D97706" fill-opacity="0.14"/>
      <rect x="255" y="110" width="290" height="390" rx="28" fill="url(#bag1)"/>
      <rect x="285" y="185" width="230" height="175" rx="18" fill="#FAF7F2"/>
      <circle cx="400" cy="242" r="28" fill="#C2410C" fill-opacity="0.15"/>
      <circle cx="400" cy="242" r="14" fill="#C2410C"/>
      <rect x="328" y="286" width="144" height="16" rx="8" fill="#29201B"/>
      <rect x="348" y="314" width="104" height="12" rx="6" fill="#8C7A6B"/>
      <rect x="295" y="96" width="210" height="24" rx="12" fill="#7C2D12"/>
      <rect x="112" y="388" width="188" height="96" rx="20" fill="#FFFFFF" fill-opacity="0.96"/>
      <rect x="136" y="414" width="120" height="14" rx="7" fill="#C2410C"/>
      <rect x="136" y="440" width="140" height="12" rx="6" fill="#6D5D53" fill-opacity="0.5"/>
    </svg>
  `),

  productCoffee1: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" fill="none">
      <rect width="640" height="420" rx="24" fill="#F5EBE0"/>
      <rect x="210" y="64" width="220" height="292" rx="24" fill="#9A3412"/>
      <rect x="234" y="128" width="172" height="142" rx="14" fill="#FAF7F2"/>
      <circle cx="320" cy="176" r="22" fill="#D97706"/>
      <rect x="262" y="214" width="116" height="14" rx="7" fill="#29201B"/>
      <rect x="276" y="238" width="88" height="10" rx="5" fill="#8C7A6B"/>
    </svg>
  `),

  productCoffee2: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" fill="none">
      <rect width="640" height="420" rx="24" fill="#EDE4D8"/>
      <path d="M220 140H420L390 296C386 318 368 334 346 334H294C272 334 254 318 250 296L220 140Z" fill="#29201B"/>
      <rect x="196" y="122" width="248" height="24" rx="12" fill="#C2410C"/>
      <rect x="256" y="334" width="128" height="22" rx="11" fill="#78716C"/>
      <path d="M416 176H448C466 176 480 190 480 208C480 226 466 240 448 240H406" stroke="#29201B" stroke-width="18" stroke-linecap="round"/>
    </svg>
  `),

  productCoffee3: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" fill="none">
      <rect width="640" height="420" rx="24" fill="#F4EFE6"/>
      <rect x="150" y="96" width="160" height="228" rx="18" fill="#B45309"/>
      <rect x="330" y="96" width="160" height="228" rx="18" fill="#15803D"/>
      <rect x="174" y="152" width="112" height="96" rx="12" fill="#FAF7F2"/>
      <rect x="354" y="152" width="112" height="96" rx="12" fill="#FAF7F2"/>
    </svg>
  `),

  heroTech: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 580" fill="none">
      <rect width="800" height="580" rx="28" fill="#0F172A"/>
      <rect x="52" y="48" width="696" height="484" rx="20" fill="#1E293B" stroke="#334155" stroke-width="2"/>
      <circle cx="92" cy="84" r="7" fill="#EF4444"/>
      <circle cx="116" cy="84" r="7" fill="#F59E0B"/>
      <circle cx="140" cy="84" r="7" fill="#10B981"/>
      <rect x="92" y="132" width="220" height="18" rx="9" fill="#38BDF8"/>
      <rect x="92" y="168" width="480" height="14" rx="7" fill="#94A3B8" fill-opacity="0.5"/>
      <rect x="92" y="198" width="420" height="14" rx="7" fill="#94A3B8" fill-opacity="0.35"/>
      <rect x="92" y="250" width="188" height="220" rx="16" fill="#0F172A" stroke="#38BDF8" stroke-opacity="0.5"/>
      <rect x="306" y="250" width="188" height="220" rx="16" fill="#0F172A" stroke="#818CF8" stroke-opacity="0.5"/>
      <rect x="520" y="250" width="188" height="220" rx="16" fill="#0F172A" stroke="#34D399" stroke-opacity="0.5"/>
      <rect x="116" y="280" width="90" height="14" rx="7" fill="#38BDF8"/>
      <rect x="330" y="280" width="90" height="14" rx="7" fill="#818CF8"/>
      <rect x="544" y="280" width="90" height="14" rx="7" fill="#34D399"/>
    </svg>
  `),
} as const;

export const PLACEHOLDER_GALLERY: { label: string; url: string }[] = [
  { label: 'Hero Creator UI', url: PLACEHOLDER_ART.heroCreator },
  { label: 'Chân dung Creator', url: PLACEHOLDER_ART.avatarCreator },
  { label: 'Chân dung Chuyên gia', url: PLACEHOLDER_ART.avatarConsultant },
  { label: 'Sản phẩm UI Kit', url: PLACEHOLDER_ART.productUiKit },
  { label: 'Khóa học Video', url: PLACEHOLDER_ART.productCourse },
  { label: 'Mentoring 1-1', url: PLACEHOLDER_ART.productMentorship },
  { label: 'Hero Sản phẩm', url: PLACEHOLDER_ART.heroProduct },
  { label: 'Cà phê Đặc sản', url: PLACEHOLDER_ART.productCoffee1 },
  { label: 'Dụng cụ Pha chế', url: PLACEHOLDER_ART.productCoffee2 },
  { label: 'SpecKit Code UI', url: PLACEHOLDER_ART.heroTech },
];
