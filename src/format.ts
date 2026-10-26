import type { Locatie } from './types';

const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const tweeCijfers = (n: number) => n.toString().padStart(2, '0');

// "14 okt 2026 · 13:12"
export function formatDatum(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()} · ${tweeCijfers(d.getHours())}:${tweeCijfers(d.getMinutes())}`;
}

// "52.2112 N, 5.9699 E"
export function formatLocatie(locatie: Locatie | null): string {
  if (!locatie) return 'Niet beschikbaar (geen GPS-signaal)';
  const { latitude, longitude } = locatie;
  const ns = latitude >= 0 ? 'N' : 'S';
  const ew = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(4)} ${ns}, ${Math.abs(longitude).toFixed(4)} ${ew}`;
}

export function kaartLink(locatie: Locatie): string {
  return `https://maps.google.com/?q=${locatie.latitude},${locatie.longitude}`;
}

const MAANDEN_VOL = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

// Sleutel per kalenderdag, om meldingen per dag te groeperen.
export function dagSleutel(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// "Vandaag", "Gisteren" of "14 oktober 2026"
export function dagLabel(iso: string): string {
  const d = new Date(iso);
  const vandaag = new Date();
  const gisteren = new Date();
  gisteren.setDate(vandaag.getDate() - 1);
  if (dagSleutel(iso) === dagSleutel(vandaag.toISOString())) return 'Vandaag';
  if (dagSleutel(iso) === dagSleutel(gisteren.toISOString())) return 'Gisteren';
  return `${d.getDate()} ${MAANDEN_VOL[d.getMonth()]} ${d.getFullYear()}`;
}

// "13:12"
export function formatTijd(iso: string): string {
  const d = new Date(iso);
  return `${tweeCijfers(d.getHours())}:${tweeCijfers(d.getMinutes())}`;
}
