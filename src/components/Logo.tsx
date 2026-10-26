import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '../theme';

const BLAD = '#7BB342'; // lichtgroen van het blad

// GroenInspect-logo: blad met nerven. Vervang dit component door het
// officiële logobestand zodra dat beschikbaar is.
// variant "licht" = wit vlak, voor gebruik op een donkergroene achtergrond.
export function Logo({ size = 72, variant = 'donker' }: { size?: number; variant?: 'donker' | 'licht' }) {
  const vlak = variant === 'licht' ? colors.white : colors.primary;
  const nerf = variant === 'licht' ? colors.primary : colors.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" accessibilityLabel="GroenInspect logo">
      <Rect x="0" y="0" width="72" height="72" rx="18" fill={vlak} />
      <Path d="M18 52 C18 30 32 18 54 18 C54 40 42 54 22 54 Z" fill={BLAD} />
      <Path d="M20 52 L44 28" stroke={nerf} strokeWidth="3" strokeLinecap="round" />
      <Path
        d="M31 41 L31 33 M37 35 L37 28 M31 41 L39 41 M37 35 L45 35"
        stroke={nerf}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
