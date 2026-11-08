const PATHS: Record<string, string> = {
  play: 'M8 5.5v13l11-6.5z',
  replay: 'M4.5 12a7.5 7.5 0 1 0 2.3-5.4M4.5 4v4.8h4.8',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  home: 'M4 11l8-6.5 8 6.5M6.5 9.5V19h11V9.5',
  soundOn: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  soundOff: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 9.5l5 5M21 9.5l-5 5',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  info: 'M12 11v6M12 7.2v.1',
  restart: 'M4.5 12a7.5 7.5 0 1 0 2.3-5.4M4.5 4v4.8h4.8',
};

export function Icon({ name, size = 28, stroke = 2.6, fill }: { name: keyof typeof PATHS | string; size?: number; stroke?: number; fill?: boolean }) {
  const solid = fill ?? name === 'play';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path
        d={PATHS[name]}
        fill={solid ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={solid ? 1.5 : stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
