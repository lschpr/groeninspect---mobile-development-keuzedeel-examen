import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth';
import { Icon, Screen, SegmentedControl, Status } from '../components/ui';
import { bevestig } from '../dialog';
import { dagLabel, dagSleutel, formatTijd } from '../format';
import { laadMeldingen } from '../storage';
import { colors, hairline, radius, type } from '../theme';
import type { Melding, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Overzicht'>;

type Filter = 'alle' | 'open' | 'verstuurd';

export function OverzichtScreen({ navigation }: Props) {
  const { medewerker, uitloggen } = useAuth();
  const [meldingen, setMeldingen] = useState<Melding[] | null>(null);
  const [filter, setFilter] = useState<Filter>('alle');
  const [verversen, setVerversen] = useState(false);

  const laad = useCallback(async () => {
    const alle = await laadMeldingen();
    setMeldingen(alle.filter((m) => m.medewerkerGebruikersnaam === medewerker?.gebruikersnaam));
  }, [medewerker]);

  // Opnieuw laden zodra het scherm weer in beeld komt (na opslaan/versturen).
  useFocusEffect(
    useCallback(() => {
      laad();
    }, [laad]),
  );

  const onVerversen = async () => {
    setVerversen(true);
    await laad();
    setVerversen(false);
  };

  const aantalOpen = (meldingen ?? []).filter((m) => m.verstuurdOp === null).length;

  // Meldingen per dag, nieuwste eerst.
  const secties = useMemo(() => {
    const zichtbaar = (meldingen ?? []).filter((m) =>
      filter === 'alle' ? true : filter === 'verstuurd' ? m.verstuurdOp !== null : m.verstuurdOp === null,
    );
    const perDag = new Map<string, { title: string; data: Melding[] }>();
    for (const m of zichtbaar) {
      const sleutel = dagSleutel(m.aangemaaktOp);
      if (!perDag.has(sleutel)) perDag.set(sleutel, { title: dagLabel(m.aangemaaktOp), data: [] });
      perDag.get(sleutel)!.data.push(m);
    }
    return [...perDag.values()];
  }, [meldingen, filter]);

  const onUitloggen = async () => {
    if (await bevestig('Uitloggen', 'Weet je zeker dat je wilt uitloggen?', 'Uitloggen')) uitloggen();
  };

  const kop = (
    <View>
      <View style={styles.titelRij}>
        <Text style={styles.largeTitle}>Meldingen</Text>
        <Pressable
          onPress={() => navigation.navigate('NieuweMelding')}
          hitSlop={8}
          style={({ pressed }) => [styles.plus, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Nieuwe melding"
        >
          <Icon name="plus" size={24} color={colors.white} />
        </Pressable>
      </View>
      <Text style={styles.subtitle}>
        {medewerker?.naam}
        {aantalOpen > 0 ? ` · ${aantalOpen} nog te versturen` : ''}
      </Text>
      <View style={styles.segmented}>
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'alle', label: 'Alle' },
            { key: 'open', label: 'Niet verstuurd' },
            { key: 'verstuurd', label: 'Verstuurd' },
          ]}
        />
      </View>
    </View>
  );

  if (meldingen === null) {
    return (
      <Screen>
        {kop}
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.secondary} />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionList
        sections={secties}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={kop}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 96, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={verversen} onRefresh={onVerversen} tintColor={colors.secondary} />}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title.toUpperCase()}</Text>}
        ListEmptyComponent={
          <View style={styles.leeg}>
            <Icon name="tray" size={44} color={colors.tertiary} />
            <Text style={styles.leegTitel}>Geen meldingen gevonden</Text>
            <Text style={styles.leegTekst}>
              {filter === 'alle'
                ? 'Meldingen die je aanmaakt verschijnen hier.'
                : 'Er zijn geen meldingen in deze selectie.'}
            </Text>
          </View>
        }
        renderItem={({ item, index, section }) => {
          const eerste = index === 0;
          const laatste = index === section.data.length - 1;
          return (
            <Pressable
              onPress={() => navigation.navigate('Details', { id: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`${item.categorie}, ${item.beschrijving}`}
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.rij,
                    eerste && styles.rijEerste,
                    laatste && styles.rijLaatste,
                    pressed && { backgroundColor: colors.fill },
                  ]}
                >
                  <Image source={{ uri: item.fotoUri }} style={styles.thumb} contentFit="cover" transition={150} />
                  <View style={[styles.rijTekst, !laatste && styles.rijLijn]}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.rijKop}>
                        <Text style={styles.categorie}>{item.categorie}</Text>
                        <Text style={styles.tijd}>{formatTijd(item.aangemaaktOp)}</Text>
                      </View>
                      <Text style={styles.beschrijving} numberOfLines={1}>
                        {item.beschrijving}
                      </Text>
                      <View style={{ marginTop: 4 }}>
                        <Status verstuurd={item.verstuurdOp !== null} />
                      </View>
                    </View>
                    <Icon name="chevron-right" size={22} color={colors.tertiary} />
                  </View>
                </View>
              )}
            </Pressable>
          );
        }}
      />
      <Pressable
        onPress={onUitloggen}
        style={({ pressed }) => [styles.profiel, pressed && { transform: [{ scale: 0.94 }] }]}
        accessibilityRole="button"
        accessibilityLabel={`Uitloggen (${medewerker?.naam ?? ''})`}
      >
        <Icon name="logout" size={26} color={colors.primary} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titelRij: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  profiel: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: hairline,
    borderColor: colors.separator,
    // Zwevend: duidelijke schaduw zodat de knop boven de lijst ligt.
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  plus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeTitle: { ...type.largeTitle, color: colors.text },
  subtitle: { ...type.callout, color: colors.secondary, paddingHorizontal: 16, marginTop: 2 },
  segmented: { paddingHorizontal: 16, marginTop: 16, marginBottom: 4 },
  sectionHeader: {
    ...type.sectionHeader,
    color: colors.secondary,
    marginHorizontal: 32,
    marginTop: 24,
    marginBottom: 7,
  },
  rij: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingLeft: 12,
    backgroundColor: colors.card,
  },
  rijEerste: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  rijLaatste: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.fill },
  rijTekst: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
    paddingRight: 10,
    paddingVertical: 12,
  },
  rijLijn: { borderBottomWidth: hairline, borderBottomColor: colors.separator },
  rijKop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  categorie: { ...type.headline, color: colors.text },
  tijd: { ...type.footnote, color: colors.tertiary },
  beschrijving: { ...type.callout, color: colors.secondary, marginTop: 1 },
  leeg: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 64 },
  leegTitel: { ...type.headline, color: colors.text, marginTop: 12 },
  leegTekst: { ...type.callout, color: colors.secondary, textAlign: 'center', marginTop: 4 },
});
