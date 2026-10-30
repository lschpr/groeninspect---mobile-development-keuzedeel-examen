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

| Gebruikersnaam | Wachtwoord | Naam | Rol |
|---|---|---|---|
| `admin` | `admin123` | Beheerder | Admin |
| `lvanvliet` | `groen123` | L. van Vliet | Medewerker |
| `demo` | `demo123` | Demo Medewerker | Medewerker |

De vaste accounts en het kantooradres (`meldingen@groeninspect.nl`) staan in `src/data/medewerkers.ts`.

## Admin: gebruikers beheren

Een account met de rol **Admin** kan in de app nieuwe gebruikers aanmaken:

1. Log in als `admin` / `admin123`.
2. Tik in het overzicht rechtsboven op het gebruikers-icoon (naast de groene +).
3. Vul onder **Nieuwe gebruiker** naam, gebruikersnaam en wachtwoord in en kies de rol
   (Medewerker of Admin). Tik op **Gebruiker toevoegen**.
4. De nieuwe gebruiker kan direct inloggen.

Regels: gebruikersnaam minimaal 3 tekens (letters, cijfers, `.`, `-`, `_`) en uniek;
wachtwoord minimaal 6 tekens. Onder **Alle gebruikers** tik je op een zelf aangemaakte
gebruiker om die te verwijderen (de meldingen blijven bewaard). De vaste accounts uit de code
en je eigen account kunnen niet verwijderd worden. Medewerkers zien het gebruikersbeheer niet;
het scherm bestaat voor hen ook niet in de navigatie.

Aangemaakte accounts worden alleen lokaal op het toestel bewaard (AsyncStorage, sleutel
`groeninspect:accounts`), dus niet gedeeld tussen toestellen. Wachtwoorden worden niet versleuteld
opgeslagen. Voor een echte uitrol hoort dit bij een server met gehashte wachtwoorden.

## Starten

```bash
npm install
npx expo start        # scan de QR-code met Expo Go
```

## Structuur

```
App.tsx                     navigatie (alleen inlogscherm zolang je niet ingelogd bent)
src/screens/                LoginScreen, NieuweMeldingScreen, OverzichtScreen, DetailsScreen,
                            GebruikersScreen (alleen admin)
src/data/medewerkers.ts     vaste accounts, inlogcontrole, gebruikers aanmaken/verwijderen
src/components/             Logo (GroenInspect-logo, SVG) en gedeelde UI-onderdelen
src/storage.ts              AsyncStorage (meldingen, sessie, accounts) + permanente opslag van foto's
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
