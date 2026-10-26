import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { Medewerker, Melding } from './types';

const MELDINGEN_KEY = 'groeninspect:meldingen';
const SESSIE_KEY = 'groeninspect:sessie';

export async function laadMeldingen(): Promise<Melding[]> {
  const json = await AsyncStorage.getItem(MELDINGEN_KEY);
  if (!json) return [];
  try {
    return JSON.parse(json) as Melding[];
  } catch {
    return [];
  }
}

async function bewaarMeldingen(meldingen: Melding[]): Promise<void> {
  await AsyncStorage.setItem(MELDINGEN_KEY, JSON.stringify(meldingen));
}

export async function voegMeldingToe(melding: Melding): Promise<void> {
  const meldingen = await laadMeldingen();
  await bewaarMeldingen([melding, ...meldingen]);
}

export async function markeerAlsVerstuurd(id: string): Promise<void> {
  const meldingen = await laadMeldingen();
  await bewaarMeldingen(
    meldingen.map((m) => (m.id === id ? { ...m, verstuurdOp: new Date().toISOString() } : m)),
  );
}

// De camera zet foto's in een tijdelijke cachemap die het besturingssysteem
// mag opruimen. Daarom kopiëren we de foto naar de documentenmap van de app,
// zodat hij een herstart of crash overleeft.
export function bewaarFotoPermanent(tijdelijkeUri: string, id: string): string {
  if (Platform.OS === 'web') return tijdelijkeUri;
  const map = new Directory(Paths.document, 'meldingen');
  map.create({ idempotent: true, intermediates: true });
  const doel = new File(map, `${id}.jpg`);
  if (doel.exists) doel.delete();
  new File(tijdelijkeUri).copy(doel);
  return doel.uri;
}

export async function laadSessie(): Promise<Medewerker | null> {
  const json = await AsyncStorage.getItem(SESSIE_KEY);
  return json ? (JSON.parse(json) as Medewerker) : null;
}

export async function bewaarSessie(medewerker: Medewerker | null): Promise<void> {
  if (medewerker) await AsyncStorage.setItem(SESSIE_KEY, JSON.stringify(medewerker));
  else await AsyncStorage.removeItem(SESSIE_KEY);
}

export function nieuwId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
