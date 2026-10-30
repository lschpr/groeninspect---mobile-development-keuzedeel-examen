import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as MailComposer from 'expo-mail-composer';
import { useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton, Footer, NavBar, PrimaryButton, Row, Screen, Section, tik } from '../components/ui';
import { KANTOOR_EMAIL } from '../data/medewerkers';
import { bevestig, toonMelding } from '../dialog';
import { formatDatum, formatLocatie, kaartLink } from '../format';
import { fotoVoorBijlage, laadMeldingen, markeerAlsVerstuurd } from '../storage';
import { colors, iconVoorCategorie, radius, type } from '../theme';
import type { Melding, RootStackParamList } from '../types';
import { deelMetFoto, downloadFoto, openMailto } from '../webMail';

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

// Bouwt de tekst van de mail als lijst van regels. De kaart-regel is null als
// er geen locatie is; .filter gooit die eruit en .join('\n') plakt de rest
// onder elkaar.
function mailTekst(m: Melding, metFoto: boolean): string {
  return [
    'Nieuwe melding via de GroenInspect app',
    '',
    `Categorie: ${m.categorie}`,
    `Beschrijving: ${m.beschrijving}`,
    `Locatie: ${formatLocatie(m.locatie)}`,
    m.locatie ? `Kaart: ${kaartLink(m.locatie)}` : null,
    `Gemeld door: ${m.medewerkerNaam}`,
    `Datum: ${formatDatum(m.aangemaaktOp)}`,
    `Melding-ID: ${m.id}`,
    '',
    metFoto ? 'De foto is als bijlage toegevoegd.' : 'Let op: de foto kon niet als bijlage worden toegevoegd.',
  ]
    .filter((regel) => regel !== null)
    .join('\n');
}

export function DetailsScreen({ navigation, route }: Props) {
  const [melding, setMelding] = useState<Melding | null>(null);
  const [versturen, setVersturen] = useState(false);

  const laad = useCallback(() => {
    laadMeldingen().then((alle) => setMelding(alle.find((m) => m.id === route.params.id) ?? null));
  }, [route.params.id]);

  // route.params.id = de id die het overzicht meegaf bij het openen.
  // useFocusEffect draait elke keer als dit scherm in beeld komt, zodat je
  // altijd de nieuwste gegevens ziet. useCallback zorgt dat `laad` dezelfde
  // functie blijft, anders zou hij bij elke render opnieuw gaan laden.
  useFocusEffect(laad);

  const onVerstuurd = async (id: string) => {
    await markeerAlsVerstuurd(id);
    tik('succes');
    laad();
  };

  // Webversie: een mailto-link kan geen bijlage meesturen, dus eerst het
  // deelmenu met foto proberen; anders de foto downloaden en de mail openen.
  const verstuurViaWeb = async (m: Melding) => {
    const onderwerp = `Melding ${m.categorie}, ${formatDatum(m.aangemaaktOp)}`;
    const bestandsnaam = `GroenInspect-${m.id}.jpg`;
    const resultaat = await deelMetFoto({
      aan: KANTOOR_EMAIL,
      onderwerp,
      tekst: mailTekst(m, true),
      fotoUri: m.fotoUri,
      bestandsnaam,
    });
    // Gedeeld of geannuleerd: dan zijn we klaar. Alleen als de browser het
    // niet kan, gaan we verder met plan B (downloaden + mailto).
    if (resultaat === 'gedeeld') await onVerstuurd(m.id);
    if (resultaat !== 'niet-ondersteund') return;

    const doorgaan = await bevestig(
      'Foto zelf toevoegen',
      'Deze browser kan de foto niet automatisch aan de mail koppelen. De foto wordt gedownload; voeg hem in je mail toe als bijlage.',
      'Foto downloaden en mail openen',
    );
    if (!doorgaan) return;
    downloadFoto(m.fotoUri, bestandsnaam);
    openMailto(KANTOOR_EMAIL, onderwerp, mailTekst(m, true));
    await onVerstuurd(m.id);
  };

  const onVersturen = async () => {
    if (!melding) return;
    setVersturen(true);
    try {
      if (Platform.OS === 'web') {
        await verstuurViaWeb(melding);
        return;
      }
      const beschikbaar = await MailComposer.isAvailableAsync();
      if (!beschikbaar) {
        tik('fout');
        toonMelding(
          'Geen mailapp beschikbaar',
          'Er is geen mailapp ingesteld op dit toestel. De melding blijft bewaard, zodat je hem later alsnog kunt versturen.',
        );
        return;
      }
      const bijlage = fotoVoorBijlage(melding);
      if (!bijlage) {
        const doorgaan = await bevestig(
          'Foto niet toegevoegd',
          'De foto van deze melding is niet meer gevonden op dit toestel. Wil je de melding zonder foto versturen?',
          'Zonder foto versturen',
        );
        if (!doorgaan) return;
      }
      // Opent de mailapp met alles al ingevuld. Daarna kijken we of de
      // gebruiker niet op annuleren drukte; zo niet, dan markeren we hem als verstuurd.
      const resultaat = await MailComposer.composeAsync({
        recipients: [KANTOOR_EMAIL],
        subject: `Melding ${melding.categorie}, ${formatDatum(melding.aangemaaktOp)}`,
        body: mailTekst(melding, bijlage !== null),
        attachments: bijlage ? [bijlage] : undefined,
      });
      if (resultaat.status !== MailComposer.MailComposerStatus.CANCELLED) await onVerstuurd(melding.id);
    } catch {
      toonMelding('Versturen mislukt', 'De mailapp kon niet worden geopend. Probeer het later opnieuw.');
    } finally {
      // finally draait altijd (ook na een return of fout), dus de knop
      // stopt hier altijd met laden.
      setVersturen(false);
    }
  };

  // `?.` = als melding nog null is (nog aan het laden), crash dan niet.
  // `!= null` checkt in één keer op null én undefined.
  const verstuurd = melding?.verstuurdOp != null;

  return (
    <Screen>
      <NavBar title="Melding" left={<BackButton label="Meldingen" onPress={() => navigation.goBack()} />} />
      {melding && (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <Image
              source={{ uri: melding.fotoUri }}
              style={styles.foto}
              contentFit="cover"
              transition={200}
              accessibilityLabel={`Foto van melding ${melding.categorie}`}
            />

            <View style={styles.kop}>
              <Text style={styles.titel}>{melding.categorie}</Text>
              <Text style={[styles.status, { color: verstuurd ? colors.primary : colors.warning }]}>
                {verstuurd ? `Verstuurd op ${formatDatum(melding.verstuurdOp!)}` : 'Nog niet verstuurd naar kantoor'}
              </Text>
            </View>

            <Section header="Beschrijving">
              <Text style={styles.beschrijving}>{melding.beschrijving}</Text>
            </Section>

            <Section header="Gegevens">
              <Row icon={iconVoorCategorie(melding.categorie)} title="Categorie" value={melding.categorie} />
              <Row icon="map-marker-outline" title="Locatie" value={formatLocatie(melding.locatie)} multiline />
              <Row icon="account-outline" title="Gemeld door" value={melding.medewerkerNaam} />
              <Row icon="calendar-blank-outline" title="Datum" value={formatDatum(melding.aangemaaktOp)} />
            </Section>
          </ScrollView>
          <Footer>
            <PrimaryButton
              title={verstuurd ? 'Opnieuw versturen via e-mail' : 'Verstuur via e-mail'}
              onPress={onVersturen}
              loading={versturen}
            />
          </Footer>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  foto: {
    marginHorizontal: 16,
    marginTop: 8,
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
  },
  kop: { paddingHorizontal: 16, marginTop: 16 },
  titel: { ...type.title, color: colors.text },
  status: { ...type.callout, fontWeight: '500', marginTop: 2 },
  beschrijving: { ...type.body, color: colors.text, padding: 16 },
});
