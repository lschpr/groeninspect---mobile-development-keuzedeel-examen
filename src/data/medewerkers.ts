import { bewaarExtraAccounts, laadExtraAccounts } from '../storage';
import type { Medewerker } from '../types';

// Eenvoudige, lokale authenticatie (geen server). De vaste accounts hieronder
// staan in de code; accounts die een admin in de app aanmaakt worden lokaal
// op het toestel bewaard (AsyncStorage).
// `&` plakt twee types samen: een Account is een Medewerker plus een wachtwoord.
export type Account = Medewerker & { wachtwoord: string };

export const ACCOUNTS: Account[] = [
  { gebruikersnaam: 'admin', wachtwoord: 'admin123', naam: 'Beheerder', rol: 'admin' },
  { gebruikersnaam: 'lvanvliet', wachtwoord: 'groen123', naam: 'L. van Vliet', rol: 'medewerker' },
  { gebruikersnaam: 'demo', wachtwoord: 'demo123', naam: 'Demo Medewerker', rol: 'medewerker' },
];

// Adres waar meldingen per e-mail naartoe gaan.
export const KANTOOR_EMAIL = 'meldingen@groeninspect.nl';

export const MIN_WACHTWOORD = 6;

// Vergelijkt gebruikersnamen zonder op hoofdletters of spaties te letten,
// dus "Demo " en "demo" tellen als dezelfde.
function zelfde(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function isVastAccount(gebruikersnaam: string): boolean {
  return ACCOUNTS.some((a) => zelfde(a.gebruikersnaam, gebruikersnaam));
}

export async function alleAccounts(): Promise<Account[]> {
  return [...ACCOUNTS, ...(await laadExtraAccounts())];
}

export async function controleerInlog(gebruikersnaam: string, wachtwoord: string): Promise<Medewerker | null> {
  const account = (await alleAccounts()).find(
    (a) => zelfde(a.gebruikersnaam, gebruikersnaam) && a.wachtwoord === wachtwoord,
  );
  // We geven het account terug zónder wachtwoord, zodat dat nergens anders
  // in de app (of in de opgeslagen sessie) terechtkomt.
  return account ? { gebruikersnaam: account.gebruikersnaam, naam: account.naam, rol: account.rol } : null;
}

// Geeft een foutmelding terug, of null als het account is aangemaakt.
export async function maakAccount(account: Account): Promise<string | null> {
  const gebruikersnaam = account.gebruikersnaam.trim().toLowerCase();
  const naam = account.naam.trim();
  if (!naam) return 'Vul een naam in.';
  // Regex: alleen kleine letters, cijfers, punt, _ of -, en minimaal 3 tekens.
  if (!/^[a-z0-9._-]{3,}$/.test(gebruikersnaam))
    return 'Gebruikersnaam: minimaal 3 tekens, alleen letters, cijfers, punt, - of _.';
  if (account.wachtwoord.length < MIN_WACHTWOORD) return `Wachtwoord: minimaal ${MIN_WACHTWOORD} tekens.`;
  if ((await alleAccounts()).some((a) => zelfde(a.gebruikersnaam, gebruikersnaam)))
    return 'Deze gebruikersnaam bestaat al.';

  const extra = await laadExtraAccounts();
  await bewaarExtraAccounts([...extra, { ...account, gebruikersnaam, naam }]);
  return null;
}

// Alleen in de app aangemaakte accounts kunnen verwijderd worden.
export async function verwijderAccount(gebruikersnaam: string): Promise<void> {
  const extra = await laadExtraAccounts();
  await bewaarExtraAccounts(extra.filter((a) => !zelfde(a.gebruikersnaam, gebruikersnaam)));
}
