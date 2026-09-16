// Mismo set de íconos SVG estáticos del front end (demo/ECOEMS_Quest_FrontEnd_V0.0.2.html),
// portado a componentes React para usarse en las pantallas reales.

type IconProps = { className?: string };

function Svg({
  children,
  fill,
  className,
}: {
  children: React.ReactNode;
  fill?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={{ width: "1em", height: "1em", verticalAlign: "-0.14em", flexShrink: 0 }}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={fill ? undefined : 1.8}
      strokeLinecap={fill ? undefined : "round"}
      strokeLinejoin={fill ? undefined : "round"}
    >
      {children}
    </svg>
  );
}

export const MATERIA_ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  "Español": ({ className }) => (
    <Svg className={className}>
      <path d="M12 6c-2-1.5-5-1.5-8-1v14c3-.5 6-.5 8 1 2-1.5 5-1.5 8-1V5c-3-.5-6-.5-8 1z" />
      <path d="M12 6v14" />
    </Svg>
  ),
  "Habilidad Verbal": ({ className }) => (
    <Svg className={className}>
      <path d="M4 5h16v10H9l-4 4v-4H4z" />
    </Svg>
  ),
  "Matemáticas": ({ className }) => (
    <Svg className={className} fill>
      <circle cx="12" cy="6.5" r="1.5" />
      <rect x="5" y="11" width="14" height="2" rx="1" />
      <circle cx="12" cy="17.5" r="1.5" />
    </Svg>
  ),
  "Habilidad Matemática": ({ className }) => (
    <Svg className={className} fill>
      <path d="M4 4h5v2a2 2 0 104 0V4h5v5h-2a2 2 0 100 4h2v5h-5v-2a2 2 0 10-4 0v2H4v-5h2a2 2 0 100-4H4z" />
    </Svg>
  ),
  "Biología": ({ className }) => (
    <Svg className={className}>
      <path d="M20 4C10 4 4 10 4 18c8 0 14-6 14-14z" />
      <path d="M7 17c3-4 6-7 11-11" />
    </Svg>
  ),
  "Física": ({ className }) => (
    <Svg className={className}>
      <ellipse cx="12" cy="12" rx="9" ry="3.6" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </Svg>
  ),
  "Química": ({ className }) => (
    <Svg className={className}>
      <path d="M9 2h6M10 2v6l-5.5 9.5A2 2 0 006.2 21h11.6a2 2 0 001.7-3.5L14 8V2" />
      <path d="M8 14h8" />
    </Svg>
  ),
  "Historia de México": ({ className }) => (
    <Svg className={className} fill>
      <rect x="3" y="3" width="18" height="2" rx="1" />
      <rect x="3" y="19" width="18" height="2" rx="1" />
      <rect x="5" y="7" width="2" height="10" />
      <rect x="9" y="7" width="2" height="10" />
      <rect x="13" y="7" width="2" height="10" />
      <rect x="17" y="7" width="2" height="10" />
    </Svg>
  ),
  "Historia Universal": ({ className }) => (
    <Svg className={className} fill>
      <rect x="3" y="3" width="18" height="2" rx="1" />
      <rect x="3" y="19" width="18" height="2" rx="1" />
      <rect x="5" y="7" width="2" height="10" />
      <rect x="9" y="7" width="2" height="10" />
      <rect x="13" y="7" width="2" height="10" />
      <rect x="17" y="7" width="2" height="10" />
    </Svg>
  ),
  "Geografía": ({ className }) => (
    <Svg className={className}>
      <circle cx="10.5" cy="10.5" r="7.5" />
      <path d="M3 10.5h15M10.5 3c2.6 2.7 2.6 12.3 0 15M10.5 3c-2.6 2.7-2.6 12.3 0 15" />
      <path
        d="M19 14c1.7 0 3 1.4 3 3.1 0 2.3-3 5-3 5s-3-2.7-3-5c0-1.7 1.3-3.1 3-3.1z"
        fill="currentColor"
        stroke="none"
      />
    </Svg>
  ),
  "Formación Cívica y Ética": ({ className }) => (
    <Svg className={className}>
      <path d="M12 3v18M7 21h10M5 7h14M5 7L2.5 12a2.5 2.5 0 005 0L5 7zM19 7l-2.5 5a2.5 2.5 0 005 0L19 7z" />
    </Svg>
  ),
};

export function BackIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M15 5l-7 7 7 7" />
    </Svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </Svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
    </Svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <Svg className={className} fill>
      <path d="M20 14.5A8.5 8.5 0 1110 3.6 6.8 6.8 0 0020 14.5z" />
    </Svg>
  );
}
