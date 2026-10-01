const paths: Record<string, string> = {
  atlas: 'M9 9l13-3 17 4v29l-17-4-13 3z M22 6v29 M15 16h3 M28 17h5 M28 24h5',
  back: 'M29 9L14 24l15 15',
  booking: 'M8 10h32v30H8z M14 6v8 M34 6v8 M8 19h32 M15 27h7 M15 33h15',
  compat: 'M14 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M34 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M6 35c1-8 4-12 8-12s8 4 8 12 M26 35c0-8 4-12 8-12s7 4 8 12 M21 18l3 3 3-3',
  emotion: 'M24 40C9 30 5 23 10 16c4-6 11-5 14 0 3-5 10-6 14 0 5 7 1 14-14 24z',
  home: 'M6 22L24 7l18 15v18H6z M19 40V27h10v13',
  invite: 'M8 17h22v18H8z M14 17v-5h16v5 M30 23h12 M36 17v12 M15 26h8',
  privacy: 'M24 6l15 6v12c0 9-5 15-15 19C14 39 9 33 9 24V12z M18 24l5 5 8-10',
  radar: 'M24 5l17 12v18L24 43 7 35V17z M24 5v38 M7 17l34 18 M41 17L7 35 M24 14l9 7-3 12-14 1-4-13z',
  share: 'M24 7v23 M16 15l8-8 8 8 M10 25v15h28V25',
  test: 'M10 16h28v22H10z M16 12h16v4 M19 26h10 M24 21v10',
  partner: 'M17 13a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M32 13a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M7 36c0-7 4-11 10-11s10 4 10 11 M23 34c0-5 3-9 9-9s9 4 9 11',
  theme: 'M7 11l11-3 12 3 11-3v28l-11 4-12-4-11 3z M18 8v28 M30 11v29 M22 25l3 3 5-7',
  my: 'M24 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M9 40c0-9 5-14 15-14s15 5 15 14',
  'fit-same': 'M24 8a16 16 0 1 1 0 32 16 16 0 1 1 0-32z M15 24l6 6 12-13',
  'fit-mix': 'M11 24h10 M16 19v10 M27 24h10',
  'fit-talk': 'M8 12h32v16H22l-7 7v-7H8z M16 20h16',
}

export default function Icon({ name, size = 22, stroke = 1.8 }: { name: keyof typeof paths | string; size?: number; stroke?: number }) {
  return (
    <svg className='line-icon' viewBox='0 0 48 48' width={size} height={size} aria-hidden='true'>
      <path d={paths[name] || paths.test} fill='none' stroke='currentColor' strokeWidth={stroke} strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}
