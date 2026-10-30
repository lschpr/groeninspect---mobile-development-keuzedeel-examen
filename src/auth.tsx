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

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [medewerker, setMedewerker] = useState<Medewerker | null>(null);
  const [laden, setLaden] = useState(true);

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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth moet binnen AuthProvider gebruikt worden');
  return ctx;
}
