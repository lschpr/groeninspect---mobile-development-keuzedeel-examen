import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { controleerInlog } from './data/medewerkers';
import { bewaarSessie, laadSessie } from './storage';
import type { Medewerker } from './types';

type AuthContextValue = {
  medewerker: Medewerker | null;
  laden: boolean;
  inloggen: (gebruikersnaam: string, wachtwoord: string) => Promise<boolean>;
  uitloggen: () => Promise<void>;
};

// Een context is een soort "gedeelde doos" met gegevens. Elk scherm kan erin
// kijken zonder dat je de gegevens via props van scherm naar scherm doorgeeft.
// Hier zit erin: wie er ingelogd is, en functies om in/uit te loggen.
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [medewerker, setMedewerker] = useState<Medewerker | null>(null);
  const [laden, setLaden] = useState(true);

  // De lege [] aan het eind betekent: dit maar één keer doen, bij het starten.
  // We halen de opgeslagen login op; .finally() draait altijd, ook bij een
  // fout, zodat het laad-rondje nooit blijft hangen.
  useEffect(() => {
    laadSessie()
      .then(setMedewerker)
      .finally(() => setLaden(false));
  }, []);

  const inloggen = async (gebruikersnaam: string, wachtwoord: string) => {
    const gevonden = await controleerInlog(gebruikersnaam, wachtwoord);
    if (!gevonden) return false;
    await bewaarSessie(gevonden);
    setMedewerker(gevonden);
    return true;
  };

  const uitloggen = async () => {
    await bewaarSessie(null);
    setMedewerker(null);
  };

  return (
    <AuthContext.Provider value={{ medewerker, laden, inloggen, uitloggen }}>{children}</AuthContext.Provider>
  );
}

// Eigen hook: in een scherm schrijf je gewoon `const { medewerker } = useAuth()`.
// De fout krijg je alleen als je hem gebruikt buiten de AuthProvider om.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth moet binnen AuthProvider gebruikt worden');
  return ctx;
}
