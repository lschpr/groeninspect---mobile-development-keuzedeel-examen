import type { Medewerker } from '../types';

// Eenvoudige, lokale authenticatie (zie out-of-scope: geen server en geen
// gebruikersbeheer). Pas deze lijst aan om medewerkers toe te voegen.
type Account = Medewerker & { wachtwoord: string };

export const ACCOUNTS: Account[] = [
  { gebruikersnaam: 'lvanvliet', wachtwoord: 'groen123', naam: 'L. van Vliet' },
  { gebruikersnaam: 'demo', wachtwoord: 'demo123', naam: 'Demo Medewerker' },
];

// Adres waar meldingen per e-mail naartoe gaan.
export const KANTOOR_EMAIL = 'meldingen@groeninspect.nl';

export function controleerInlog(gebruikersnaam: string, wachtwoord: string): Medewerker | null {
  const account = ACCOUNTS.find(
    (a) => a.gebruikersnaam.toLowerCase() === gebruikersnaam.trim().toLowerCase() && a.wachtwoord === wachtwoord,
  );
  return account ? { gebruikersnaam: account.gebruikersnaam, naam: account.naam } : null;
}
