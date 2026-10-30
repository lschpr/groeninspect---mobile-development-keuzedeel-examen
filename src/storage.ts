import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { Account } from './data/medewerkers';
import type { Medewerker, Melding } from './types';

const MELDINGEN_KEY = 'groeninspect:meldingen';
const SESSIE_KEY = 'groeninspect:sessie';
const ACCOUNTS_KEY = 'groeninspect:accounts';

// AsyncStorage is een simpele opslag op de telefoon: je bewaart tekst onder
// een sleutel (key). Lijsten zetten we daarom om naar tekst met
// JSON.stringify, en bij het lezen terug naar een lijst met JSON.parse.
// De try/catch vangt kapotte opgeslagen tekst op: dan gewoon een lege lijst.
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

// [melding, ...meldingen] = een nieuwe lijst met de nieuwe melding vooraan en
// daarna alle oude (de ... "pakt de lijst uit").
export async function voegMeldingToe(melding: Melding): Promise<void> {
  const meldingen = await laadMeldingen();
  await bewaarMeldingen([melding, ...meldingen]);
}

// .map loopt alle meldingen langs. Is het de juiste id, dan maken we een kopie
// ({ ...m }) met alleen verstuurdOp aangepast; de rest blijft hetzelfde.
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

// Geeft een bestand terug dat de mailapp als bijlage kan lezen, of null als
// de foto niet (meer) bestaat. Het opgeslagen pad kan verouderd zijn (op iOS
// verandert de app-map na een update/herinstallatie), dus we zoeken de foto
// eerst op in de huidige documentenmap. Daarna kopiëren we hem naar de cache
// met een duidelijke bestandsnaam; Android-mailapps kunnen die map lezen.
// Niet voor web; zie daarvoor webMail.ts.
export function fotoVoorBijlage(melding: Melding): string | null {
  const kandidaten = [new File(Paths.document, 'meldingen', `${melding.id}.jpg`), new File(melding.fotoUri)];
  const bron = kandidaten.find((f) => f.exists);
  if (!bron) return null;

  const map = new Directory(Paths.cache, 'bijlagen');
  map.create({ idempotent: true, intermediates: true });
  const bijlage = new File(map, `GroenInspect-${melding.id}.jpg`);
  if (bijlage.exists) bijlage.delete();
  bron.copy(bijlage);
  return bijlage.uri;
}

export async function laadSessie(): Promise<Medewerker | null> {
  const json = await AsyncStorage.getItem(SESSIE_KEY);
  if (!json) return null;
  const sessie = JSON.parse(json) as Medewerker;
  // Sessies van voor de invoering van rollen hebben nog geen rol.
  // `??` betekent: als het links leeg is (null/undefined), neem dan het rechtse.
  return { ...sessie, rol: sessie.rol ?? 'medewerker' };
}

export async function bewaarSessie(medewerker: Medewerker | null): Promise<void> {
  if (medewerker) await AsyncStorage.setItem(SESSIE_KEY, JSON.stringify(medewerker));
  else await AsyncStorage.removeItem(SESSIE_KEY);
}

// Accounts die een admin in de app heeft aangemaakt.
export async function laadExtraAccounts(): Promise<Account[]> {
  const json = await AsyncStorage.getItem(ACCOUNTS_KEY);
  if (!json) return [];
  try {
    return JSON.parse(json) as Account[];
  } catch {
    return [];
  }
}

export async function bewaarExtraAccounts(accounts: Account[]): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// Maakt een unieke id: de huidige tijd + een paar willekeurige tekens.
// toString(36) schrijft een getal kort op met cijfers én letters (0-9, a-z).
export function nieuwId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
