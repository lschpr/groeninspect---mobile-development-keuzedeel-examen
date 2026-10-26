import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../auth';
import { Footer, Icon, PrimaryButton, Row, Screen, Section, tik } from '../components/ui';
import { bevestig, toonMelding } from '../dialog';
import { dagLabel, formatLocatie, formatTijd } from '../format';
import { bepaalLocatie } from '../location';
import { bewaarFotoPermanent, nieuwId, voegMeldingToe } from '../storage';
import { categorieIcoon, colors, hairline, radius, type } from '../theme';
import { CATEGORIEEN, type Categorie, type Locatie, type RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'NieuweMelding'>;

const MAX_TEKENS = 500;
const MAX_TEKENS_CUSTOM = 40;

const FOTO_OPTIES: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.6, // kleiner bestand: sneller opslaan en versturen
  base64: Platform.OS === 'web',
};

// Veelvoorkomende meldingen per categorie; een tik vult de beschrijving aan.
const SUGGESTIES: Record<Categorie, string[]> = {
  Bomen: ['Scheefstaande boom', 'Afgebroken tak', 'Boom is ziek', 'Wortelopdruk'],
  Plantsoenen: ['Zieke struiken', 'Onkruid', 'Vernielde beplanting', 'Zwerfafval'],
  Straatgroen: ['Kapotte paal', 'Overhangende takken', 'Beschadigde boomspiegel', 'Zwerfafval'],
  Bermen: ['Overhangend gras', 'Gras moet gemaaid', 'Diepe sporen in berm', 'Zwerfafval'],
};

export function NieuweMeldingScreen({ navigation }: Props) {
  const { medewerker } = useAuth();
  // Gekozen categorie, of 'custom' als de medewerker zelf een categorie invult.
  const [keuze, setKeuze] = useState<Categorie | 'custom' | null>(null);
  const [customCategorie, setCustomCategorie] = useState('');
  const categorie = keuze === 'custom' ? customCategorie.trim() || null : keuze;
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [beschrijving, setBeschrijving] = useState('');
  const [opslaan, setOpslaan] = useState(false);
  // Fouten pas tonen nadat de medewerker één keer op "Opslaan" heeft gedrukt.
  const [toonFouten, setToonFouten] = useState(false);
  // Tijdstip van de melding, getoond onder de titel.
  const [gestart] = useState(() => new Date().toISOString());
  // Scheidingslijn onder de kop alleen tonen als de inhoud eronder schuift.
  const [gescrold, setGescrold] = useState(false);

  // GPS wordt direct bij openen opgehaald, zodat de locatie meestal al klaar
  // is wanneer de medewerker op "Opslaan" drukt.
  const [locatie, setLocatie] = useState<Locatie | null>(null);
  const [locatieBezig, setLocatieBezig] = useState(true);
  const locatiePromise = useRef<Promise<Locatie | null> | null>(null);

  useEffect(() => {
    const p = bepaalLocatie();
    locatiePromise.current = p;
    p.then((l) => {
      setLocatie(l);
      setLocatieBezig(false);
    });
  }, []);

  // Bevestiging vragen bij annuleren (knop, veeggebaar of Android-terugknop).
  const heeftInvoer = keuze !== null || fotoUri !== null || beschrijving.trim().length > 0;
  // usePreventRemove i.p.v. een 'beforeRemove'-listener: native-stack schakelt
  // dan zelf het veeggebaar uit, zodat het scherm niet native al verdwijnt.
  const [magVerlaten, setMagVerlaten] = useState(false);
  usePreventRemove(heeftInvoer && !magVerlaten, ({ data }) => {
    bevestig('Melding verwijderen?', 'De ingevoerde gegevens worden niet opgeslagen.', 'Verwijder', 'Verder gaan').then(
      (ok) => {
        if (ok) navigation.dispatch(data.action);
      },
    );
  });

  // Na opslaan pas teruggaan als de blokkade is opgeheven.
  useEffect(() => {
    if (magVerlaten) navigation.goBack();
  }, [magVerlaten, navigation]);

  const verwerkFoto = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;
    const asset = result.assets[0];
    if (Platform.OS === 'web' && asset.base64) {
      setFotoUri(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
    } else {
      setFotoUri(asset.uri);
    }
  };

  const maakFoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      toonMelding('Geen toegang tot camera', 'Geef de app toestemming voor de camera in de instellingen.');
      return;
    }
    verwerkFoto(await ImagePicker.launchCameraAsync(FOTO_OPTIES));
  };

  const kiesFoto = async () => {
    verwerkFoto(await ImagePicker.launchImageLibraryAsync(FOTO_OPTIES));
  };

  const voegSuggestieToe = (tekst: string) => {
    setBeschrijving((huidig) => {
      const basis = huidig.trim();
      const nieuw = basis ? `${basis}${/[.!?]$/.test(basis) ? '' : '.'} ${tekst}` : tekst;
      return nieuw.slice(0, MAX_TEKENS);
    });
  };

  const onOpslaan = async () => {
    if (!categorie || !fotoUri || !beschrijving.trim() || !medewerker) {
      tik('fout');
      setToonFouten(true);
      return;
    }

    setOpslaan(true);
    const gpsLocatie = locatieBezig ? await locatiePromise.current : locatie;
    if (!gpsLocatie) {
      const doorgaan = await bevestig(
        'Geen GPS-locatie',
        'De locatie kon niet worden bepaald. Wil je de melding opslaan zonder locatie?',
        'Opslaan zonder locatie',
      );
      if (!doorgaan) {
        setOpslaan(false);
        return;
      }
    }

    try {
      const id = nieuwId();
      await voegMeldingToe({
        id,
        categorie,
        beschrijving: beschrijving.trim(),
        fotoUri: bewaarFotoPermanent(fotoUri, id),
        locatie: gpsLocatie,
        medewerkerNaam: medewerker.naam,
        medewerkerGebruikersnaam: medewerker.gebruikersnaam,
        aangemaaktOp: new Date().toISOString(),
        verstuurdOp: null,
      });
      tik('succes');
      setMagVerlaten(true);
    } catch {
      setOpslaan(false);
      const opnieuw = await bevestig(
        'Opslaan mislukt',
        'De melding kon niet lokaal worden opgeslagen. Controleer of er voldoende opslagruimte is.',
        'Opnieuw proberen',
      );
      if (opnieuw) onOpslaan();
    }
  };

  const fout = (ontbreekt: boolean, tekst: string) => (toonFouten && ontbreekt ? tekst : undefined);

  return (
    <Screen>
      <View style={[styles.kop, gescrold && styles.kopLijn]}>
        {Platform.OS === 'ios' && <View style={styles.greep} />}
        <View style={styles.kopRij}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kopTitel} accessibilityRole="header">
              Nieuwe melding
            </Text>
            <Text style={styles.kopSub}>
              {dagLabel(gestart)} · {formatTijd(gestart)}
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={({ pressed }) => [styles.sluit, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Annuleren"
          >
            <Icon name="close" size={20} color={colors.secondary} />
          </Pressable>
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={(e) => setGescrold(e.nativeEvent.contentOffset.y > 4)}
        >
          <Section
            header="Categorie"
            footer={fout(!categorie, keuze === 'custom' ? 'Vul een eigen categorie in.' : 'Kies een categorie.')}
            footerKleur={colors.danger}
          >
            {CATEGORIEEN.map((c) => (
              <Row
                key={c}
                icon={categorieIcoon[c]}
                title={c}
                onPress={() => setKeuze(c)}
                accessory={keuze === c ? 'check' : 'none'}
              />
            ))}
            <Row
              icon="pencil-outline"
              title="Custom"
              onPress={() => setKeuze('custom')}
              accessory={keuze === 'custom' ? 'check' : 'none'}
            />
            {keuze === 'custom' && (
              <TextInput
                style={styles.customInput}
                placeholder="Eigen categorie, bijv. Speeltuin"
                placeholderTextColor={colors.tertiary}
                value={customCategorie}
                onChangeText={setCustomCategorie}
                maxLength={MAX_TEKENS_CUSTOM}
                autoFocus
                autoCapitalize="sentences"
                returnKeyType="done"
                accessibilityLabel="Eigen categorie"
              />
            )}
          </Section>

          <Section header="Foto" footer={fout(!fotoUri, 'Voeg een foto toe.')} footerKleur={colors.danger}>
            {fotoUri && <Image source={{ uri: fotoUri }} style={styles.foto} contentFit="cover" transition={150} />}
            <Row
              icon="camera-outline"
              title={fotoUri ? 'Opnieuw maken' : 'Foto maken'}
              titleColor={colors.primary}
              onPress={maakFoto}
            />
            {fotoUri ? (
              <Row icon="image-off-outline" title="Foto verwijderen" titleColor={colors.danger} onPress={() => setFotoUri(null)} />
            ) : (
              <Row icon="image-outline" title="Kies uit galerij" titleColor={colors.primary} onPress={kiesFoto} />
            )}
          </Section>

          <Section
            header="Beschrijving"
            footer={fout(!beschrijving.trim(), 'Beschrijf kort wat er aan de hand is.') ?? `${beschrijving.length} van ${MAX_TEKENS} tekens`}
            footerKleur={toonFouten && !beschrijving.trim() ? colors.danger : undefined}
          >
            <TextInput
              style={styles.textarea}
              placeholder="Wat is er aan de hand, en waar precies?"
              placeholderTextColor={colors.tertiary}
              multiline
              textAlignVertical="top"
              value={beschrijving}
              onChangeText={setBeschrijving}
              maxLength={MAX_TEKENS}
              accessibilityLabel="Beschrijving"
            />
            {keuze && keuze !== 'custom' && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggesties}
                keyboardShouldPersistTaps="handled"
              >
                {SUGGESTIES[keuze].map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => voegSuggestieToe(s)}
                    style={({ pressed }) => [styles.suggestie, pressed && { opacity: 0.6 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Voeg toe: ${s}`}
                  >
                    <Text style={styles.suggestieTekst}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Section>

          <Section header="Automatisch toegevoegd" footer="Locatie en naam worden bij het opslaan aan de melding gekoppeld.">
            <Row
              icon="map-marker-outline"
              title="Locatie"
              value={locatieBezig ? 'Bepalen…' : locatie ? formatLocatie(locatie) : 'Geen GPS-signaal'}
            />
            <Row icon="account-outline" title="Medewerker" value={medewerker?.naam ?? ''} />
          </Section>
        </ScrollView>
        <Footer>
          <PrimaryButton title="Opslaan" onPress={onOpslaan} loading={opslaan} />
        </Footer>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  customInput: { ...type.body, color: colors.text, minHeight: 50, paddingHorizontal: 16, paddingLeft: 50 },
  kop: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: hairline,
    borderBottomColor: 'transparent',
  },
  kopLijn: { borderBottomColor: colors.separator },
  greep: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.separator,
    marginBottom: 10,
  },
  kopRij: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kopTitel: { ...type.title, color: colors.text },
  kopSub: { ...type.footnote, color: colors.secondary, marginTop: 2 },
  sluit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foto: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.fill },
  textarea: { ...type.body, color: colors.text, minHeight: 112, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  suggesties: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  suggestie: { backgroundColor: colors.tint, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  suggestieTekst: { ...type.footnote, fontSize: 14, color: colors.primary, fontWeight: '500' },
});
