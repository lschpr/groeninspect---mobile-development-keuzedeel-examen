import * as Location from 'expo-location';

import type { Locatie } from './types';

const TIMEOUT_MS = 10000;

// Haalt de huidige GPS-locatie op via de native locatie-API. Geeft null terug
// als er geen toestemming is of binnen de timeout geen positie gevonden wordt;
// in dat geval valt hij terug op de laatst bekende positie.
export async function bepaalLocatie(): Promise<Locatie | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    // Promise.race = een wedstrijd: wie het eerst klaar is wint. Of de GPS
    // geeft een positie, of na 10 seconden "wint" de timer met null. Zo
    // blijft de app nooit eindeloos wachten op de GPS.
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS));
    const positie = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      timeout,
    ]);
    // Geen verse positie? Dan de laatst bekende positie van de telefoon.
    const resultaat = positie ?? (await Location.getLastKnownPositionAsync());
    if (!resultaat) return null;
    return { latitude: resultaat.coords.latitude, longitude: resultaat.coords.longitude };
  } catch {
    return null;
  }
}
