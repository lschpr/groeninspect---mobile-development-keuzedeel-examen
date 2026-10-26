import { StyleSheet } from 'react-native';

import type { Categorie } from './types';

// Huisstijl GroenInspect. Eén accentkleur (groen) die alleen gebruikt wordt
// waar iets te doen is; de rest is rustig neutraal. Hoog contrast zodat de
// app buiten in fel zonlicht leesbaar blijft.
export const colors = {
  primary: '#1E5B32',
  tint: '#E5EEE6', // zachte achtergrond voor geselecteerde/actieve elementen
  background: '#F2F2EE', // warm gebroken wit, zoals een veldnotitieboek
  card: '#FFFFFF',
  separator: '#DADCD5',
  fill: '#E8E9E3', // track van segmented control, invoervelden
  text: '#141A15',
  secondary: '#5C665E',
  tertiary: '#8D958E',
  danger: '#B3261E',
  warning: '#94590A',
  white: '#FFFFFF',
};

export const hairline = StyleSheet.hairlineWidth;

// Typografie: systeemlettertype. Grote tekst krijgt negatieve letterspatiëring,
// kleine tekst blijft op 0.
export const type = {
  largeTitle: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.6, lineHeight: 38 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 28 },
  headline: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 22 },
  body: { fontSize: 17, fontWeight: '400' as const, letterSpacing: -0.2, lineHeight: 23 },
  callout: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  sectionHeader: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.2, lineHeight: 18 },
};

export const radius = { sm: 8, md: 12 };

// Maximale breedte van de inhoud, zodat de layout op tablets niet uitrekt.
export const CONTENT_MAX_WIDTH = 640;

// Categorieën onderscheiden we met een icoon, niet met een eigen kleur.
export const categorieIcoon: Record<Categorie, 'tree-outline' | 'flower-outline' | 'road-variant' | 'grass'> = {
  Bomen: 'tree-outline',
  Plantsoenen: 'flower-outline',
  Straatgroen: 'road-variant',
  Bermen: 'grass',
};

// Icoon voor een opgeslagen categorie; eigen (custom) categorieën krijgen een label-icoon.
export function iconVoorCategorie(categorie: string) {
  return categorieIcoon[categorie as Categorie] ?? 'tag-outline';
}
