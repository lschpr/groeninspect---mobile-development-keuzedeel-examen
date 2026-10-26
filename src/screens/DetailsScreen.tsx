import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as MailComposer from 'expo-mail-composer';
import { useCallback, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton, Footer, NavBar, PrimaryButton, Row, Screen, Section, tik } from '../components/ui';
import { KANTOOR_EMAIL } from '../data/medewerkers';
import { toonMelding } from '../dialog';
import { formatDatum, formatLocatie, kaartLink } from '../format';
import { laadMeldingen, markeerAlsVerstuurd } from '../storage';
import { colors, iconVoorCategorie, radius, type } from '../theme';
import type { Melding, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

function mailTekst(m: Melding): string {
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
    'De foto is als bijlage toegevoegd.',
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

  useFocusEffect(laad);

  const onVersturen = async () => {
    if (!melding) return;
    setVersturen(true);
    try {
      const beschikbaar = await MailComposer.isAvailableAsync();
      if (!beschikbaar) {
        tik('fout');
        toonMelding(
          'Geen mailapp beschikbaar',
          'Er is geen mailapp ingesteld op dit toestel. De melding blijft bewaard, zodat je hem later alsnog kunt versturen.',
        );
        return;
      }
      const resultaat = await MailComposer.composeAsync({
        recipients: [KANTOOR_EMAIL],
        subject: `Melding ${melding.categorie}, ${formatDatum(melding.aangemaaktOp)}`,
        body: mailTekst(melding),
        // Op web kunnen geen bijlagen worden meegegeven via mailto.
        attachments: Platform.OS === 'web' ? undefined : [melding.fotoUri],
      });
      if (resultaat.status !== MailComposer.MailComposerStatus.CANCELLED) {
        await markeerAlsVerstuurd(melding.id);
        tik('succes');
        laad();
      }
    } catch {
      toonMelding('Versturen mislukt', 'De mailapp kon niet worden geopend. Probeer het later opnieuw.');
    } finally {
      setVersturen(false);
    }
  };

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
