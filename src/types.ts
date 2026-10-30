export const CATEGORIEEN = ['Bomen', 'Plantsoenen', 'Straatgroen', 'Bermen'] as const;
export type Categorie = (typeof CATEGORIEEN)[number];

export type Locatie = {
  latitude: number;
  longitude: number;
};

export type Melding = {
  id: string;
  categorie: string; // een vaste categorie of een eigen (custom) invulling
  beschrijving: string;
  fotoUri: string;
  locatie: Locatie | null; // null als er geen GPS-signaal was
  medewerkerNaam: string;
  medewerkerGebruikersnaam: string;
  aangemaaktOp: string; // ISO-datum
  verstuurdOp: string | null; // ISO-datum, null = nog niet verstuurd
};

// Een admin kan daarnaast gebruikers aanmaken en verwijderen.
export type Rol = 'medewerker' | 'admin';

export type Medewerker = {
  gebruikersnaam: string;
  naam: string;
  rol: Rol;
};

export type RootStackParamList = {
  Login: undefined;
  Overzicht: undefined;
  NieuweMelding: undefined;
  Details: { id: string };
  Gebruikers: undefined;
};
