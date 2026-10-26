# GroenInspect – Meldingen app

Mobiele app (React Native + Expo, TypeScript) waarmee buitendienstmedewerkers van GroenInspect
ter plekke meldingen van onderhoud of schade aan groenvoorzieningen vastleggen en per e-mail naar kantoor sturen.

## Functionaliteit (user stories)

| Story | Scherm | Wat |
|---|---|---|
| 1.1 Inloggen (M) | Inloggen | Gebruikersnaam + wachtwoord, foutmelding, tijdelijke blokkade na 5 mislukte pogingen |
| 1.2 Melding aanmaken (M) | Nieuwe melding | Categorie (Bomen, Plantsoenen, Straatgroen, Bermen), foto (camera of galerij), beschrijving |
| 1.3 GPS + naam, lokaal opslaan (M) | Nieuwe melding | Locatie en naam worden automatisch toegevoegd; opslag in AsyncStorage, foto in de documentenmap |
| 1.4 Overzicht (S) | Meldingen overzicht | Alle eigen meldingen met foto, datum, beschrijving en status "Verstuurd / Niet verstuurd" |
| 1.5 Versturen per e-mail (M) | Melding details | Opent de standaard mailapp met foto als bijlage, beschrijving, categorie en GPS-locatie |

Keuzes bij open punten uit de use-cases:
- **Geen GPS-signaal:** de app vraagt of de melding zonder locatie opgeslagen moet worden.
- **Annuleren:** bij terug gaan met ingevulde gegevens vraagt de app om bevestiging.
- **Geen mailapp:** foutmelding; de melding blijft bewaard en kan later verstuurd worden.

## Demo-accounts

| Gebruikersnaam | Wachtwoord | Naam |
|---|---|---|
| `lvanvliet` | `groen123` | L. van Vliet |
| `demo` | `demo123` | Demo Medewerker |

Accounts en het kantooradres (`meldingen@groeninspect.nl`) staan in `src/data/medewerkers.ts`.

## Starten

```bash
npm install
npx expo start        # scan de QR-code met Expo Go
```

## Structuur

```
App.tsx                     navigatie (alleen inlogscherm zolang je niet ingelogd bent)
src/screens/                LoginScreen, NieuweMeldingScreen, OverzichtScreen, DetailsScreen
src/components/             Logo (GroenInspect-logo, SVG) en gedeelde UI-onderdelen
src/storage.ts              AsyncStorage + permanente opslag van foto's
src/location.ts             GPS via expo-location
src/theme.ts                huisstijlkleuren en tekstgroottes
```

## Technieken

TypeScript · React Native / Expo SDK 58 · React Navigation · AsyncStorage · expo-location ·
expo-image-picker · expo-mail-composer · expo-file-system

UI: @expo/vector-icons (MaterialCommunityIcons) · expo-image · react-native-reanimated
(segmented control met veeranimatie) · expo-haptics (trilfeedback bij opslaan/fout)

## Ontwerp

Rustige, iOS-achtige stijl: systeemlettertype, gegroepeerde lijsten met dunne scheidingslijnen,
één accentkleur (GroenInspect-groen) alleen voor acties. Het formulier opent als sheet met
"Annuleren". Kleuren en tekststijlen staan in `src/theme.ts`.
