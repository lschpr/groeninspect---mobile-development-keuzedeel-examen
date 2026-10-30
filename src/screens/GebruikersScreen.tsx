import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useAuth } from '../auth';
import { BackButton, NavBar, PrimaryButton, Row, Screen, Section, SegmentedControl, tik } from '../components/ui';
import {
  alleAccounts,
  isVastAccount,
  maakAccount,
  MIN_WACHTWOORD,
  verwijderAccount,
  type Account,
} from '../data/medewerkers';
import { bevestig } from '../dialog';
import { colors, type } from '../theme';
import type { RootStackParamList, Rol } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Gebruikers'>;

// Alleen bereikbaar voor admins (zie App.tsx).
export function GebruikersScreen({ navigation }: Props) {
  const { medewerker } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [naam, setNaam] = useState('');
  const [gebruikersnaam, setGebruikersnaam] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [rol, setRol] = useState<Rol>('medewerker');
  const [fout, setFout] = useState<string | null>(null);
  const [gelukt, setGelukt] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);
  // Refs wijzen naar een invoerveld, zodat we na "volgende" op het
  // toetsenbord automatisch naar het volgende veld kunnen springen (.focus()).
  const gebruikersnaamRef = useRef<ComponentRef<typeof TextInput>>(null);
  const wachtwoordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const laad = useCallback(async () => setAccounts(await alleAccounts()), []);

  useFocusEffect(
    useCallback(() => {
      laad();
    }, [laad]),
  );

  // Een functie die een functie teruggeeft. wijzig(setNaam) levert een nieuwe
  // functie op die de tekst opslaat én de fout/gelukt-melding wist. Zo hoef je
  // dat niet bij elk invoerveld opnieuw te schrijven.
  const wijzig = (setter: (t: string) => void) => (t: string) => {
    setter(t);
    setFout(null);
    setGelukt(null);
  };

  const onToevoegen = async () => {
    setBezig(true);
    const melding = await maakAccount({ naam, gebruikersnaam, wachtwoord, rol });
    setBezig(false);
    if (melding) {
      tik('fout');
      setFout(melding);
      return;
    }
    tik('succes');
    setGelukt(`${naam.trim()} kan nu inloggen als "${gebruikersnaam.trim().toLowerCase()}".`);
    setNaam('');
    setGebruikersnaam('');
    setWachtwoord('');
    setRol('medewerker');
    laad();
  };

  const onVerwijderen = async (account: Account) => {
    const ok = await bevestig(
      'Gebruiker verwijderen?',
      `${account.naam} (${account.gebruikersnaam}) kan daarna niet meer inloggen. Bestaande meldingen blijven bewaard.`,
      'Verwijder',
    );
    if (!ok) return;
    await verwijderAccount(account.gebruikersnaam);
    laad();
  };

  return (
    <Screen>
      <NavBar title="Gebruikers" left={<BackButton label="Meldingen" onPress={() => navigation.goBack()} />} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Section
            header="Nieuwe gebruiker"
            footer={fout ?? gelukt ?? `Wachtwoord minimaal ${MIN_WACHTWOORD} tekens.`}
            footerKleur={fout ? colors.danger : gelukt ? colors.primary : undefined}
          >
            <TextInput
              style={styles.input}
              placeholder="Naam, bijv. J. de Boer"
              placeholderTextColor={colors.tertiary}
              autoCapitalize="words"
              value={naam}
              onChangeText={wijzig(setNaam)}
              returnKeyType="next"
              onSubmitEditing={() => gebruikersnaamRef.current?.focus()}
              accessibilityLabel="Naam"
            />
            <TextInput
              ref={gebruikersnaamRef}
              style={styles.input}
              placeholder="Gebruikersnaam"
              placeholderTextColor={colors.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
              value={gebruikersnaam}
              onChangeText={wijzig(setGebruikersnaam)}
              returnKeyType="next"
              onSubmitEditing={() => wachtwoordRef.current?.focus()}
              accessibilityLabel="Gebruikersnaam"
            />
            <TextInput
              ref={wachtwoordRef}
              style={styles.input}
              placeholder="Wachtwoord"
              placeholderTextColor={colors.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              textContentType="newPassword"
              value={wachtwoord}
              onChangeText={wijzig(setWachtwoord)}
              accessibilityLabel="Wachtwoord"
            />
            <View style={styles.rol}>
              <SegmentedControl<Rol>
                value={rol}
                onChange={setRol}
                options={[
                  { key: 'medewerker', label: 'Medewerker' },
                  { key: 'admin', label: 'Admin' },
                ]}
              />
            </View>
          </Section>
          <View style={styles.knop}>
            <PrimaryButton title="Gebruiker toevoegen" onPress={onToevoegen} loading={bezig} />
          </View>

          <Section header="Alle gebruikers" footer="Vaste accounts staan in de code en kunnen niet verwijderd worden.">
            {accounts.map((a) => {
              const vast = isVastAccount(a.gebruikersnaam);
              const jijZelf = a.gebruikersnaam === medewerker?.gebruikersnaam;
              // Vaste accounts en je eigen account kun je niet aantikken (geen
              // onPress), dus die kun je ook niet verwijderen.
              return (
                <Row
                  key={a.gebruikersnaam}
                  icon={a.rol === 'admin' ? 'shield-account-outline' : 'account-outline'}
                  title={jijZelf ? `${a.naam} (jij)` : a.naam}
                  value={`${a.gebruikersnaam} · ${a.rol === 'admin' ? 'Admin' : 'Medewerker'}${vast ? ' · vast' : ''}`}
                  multiline
                  accessory={vast || jijZelf ? 'none' : 'chevron'}
                  onPress={vast || jijZelf ? undefined : () => onVerwijderen(a)}
                />
              );
            })}
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { ...type.body, color: colors.text, paddingHorizontal: 16, minHeight: 50 },
  rol: { padding: 12 },
  knop: { marginHorizontal: 16, marginTop: 16 },
});
