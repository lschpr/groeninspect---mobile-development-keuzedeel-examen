import { useEffect, useRef, useState, type ComponentRef } from 'react';
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
import { Logo } from '../components/Logo';
import { Icon, PrimaryButton, Screen, TextButton, tik } from '../components/ui';
import { toonMelding } from '../dialog';
import { colors, hairline, radius, type } from '../theme';

// Na te veel mislukte pogingen wordt inloggen kort geblokkeerd.
const MAX_POGINGEN = 5;
const BLOKKADE_SECONDEN = 30;

export function LoginScreen() {
  const { inloggen } = useAuth();
  const wachtwoordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [gebruikersnaam, setGebruikersnaam] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [toonWachtwoord, setToonWachtwoord] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);
  const [mislukt, setMislukt] = useState(0);
  const [geblokkeerdTot, setGeblokkeerdTot] = useState<number | null>(null);
  const [nu, setNu] = useState(Date.now());

  const resterend = geblokkeerdTot ? Math.max(0, Math.ceil((geblokkeerdTot - nu) / 1000)) : 0;

  useEffect(() => {
    if (!geblokkeerdTot) return;
    const timer = setInterval(() => {
      setNu(Date.now());
      if (Date.now() >= geblokkeerdTot) {
        setGeblokkeerdTot(null);
        setMislukt(0);
        setFout(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [geblokkeerdTot]);

  const onInloggen = async () => {
    if (resterend > 0) return;
    if (!gebruikersnaam.trim() || !wachtwoord) {
      setFout('Vul je gebruikersnaam en wachtwoord in.');
      return;
    }
    setBezig(true);
    const gelukt = await inloggen(gebruikersnaam, wachtwoord);
    setBezig(false);
    if (gelukt) return;

    tik('fout');
    const pogingen = mislukt + 1;
    setMislukt(pogingen);
    setWachtwoord('');
    if (pogingen >= MAX_POGINGEN) {
      setGeblokkeerdTot(Date.now() + BLOKKADE_SECONDEN * 1000);
      setNu(Date.now());
    }
    setFout('Gebruikersnaam of wachtwoord is onjuist.');
  };

  const foutTekst =
    resterend > 0 ? `Te veel mislukte pogingen. Probeer het over ${resterend} seconden opnieuw.` : fout;

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Logo size={64} />
            <Text style={styles.title}>GroenInspect</Text>
            <Text style={styles.subtitle}>Meldingen openbaar groen</Text>
          </View>

          <View style={styles.group}>
            <TextInput
              style={styles.input}
              placeholder="Gebruikersnaam"
              placeholderTextColor={colors.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              value={gebruikersnaam}
              onChangeText={(t) => {
                setGebruikersnaam(t);
                setFout(null);
              }}
              returnKeyType="next"
              onSubmitEditing={() => wachtwoordRef.current?.focus()}
              accessibilityLabel="Gebruikersnaam"
            />
            <View style={styles.separator} />
            <View style={styles.wachtwoordRij}>
              <TextInput
                ref={wachtwoordRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="Wachtwoord"
                placeholderTextColor={colors.tertiary}
                secureTextEntry={!toonWachtwoord}
                autoComplete="password"
                textContentType="password"
                value={wachtwoord}
                onChangeText={(t) => {
                  setWachtwoord(t);
                  setFout(null);
                }}
                onSubmitEditing={onInloggen}
                returnKeyType="go"
                accessibilityLabel="Wachtwoord"
              />
              <Pressable
                onPress={() => setToonWachtwoord((v) => !v)}
                hitSlop={12}
                style={styles.oog}
                accessibilityRole="button"
                accessibilityLabel={toonWachtwoord ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
              >
                <Icon name={toonWachtwoord ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.tertiary} />
              </Pressable>
            </View>
          </View>

          <Text style={[styles.fout, !foutTekst && { opacity: 0 }]} accessibilityRole="alert">
            {foutTekst ?? ' '}
          </Text>

          <PrimaryButton title="Inloggen" onPress={onInloggen} loading={bezig} disabled={resterend > 0} />

          <View style={styles.link}>
            <TextButton
              title="Wachtwoord vergeten?"
              onPress={() =>
                toonMelding('Wachtwoord vergeten', 'Neem contact op met kantoor om je wachtwoord te laten herstellen.')
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  brand: { alignItems: 'center', marginBottom: 40 },
  title: { ...type.largeTitle, color: colors.text, marginTop: 16 },
  subtitle: { ...type.callout, color: colors.secondary, marginTop: 4 },
  group: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  input: { ...type.body, color: colors.text, paddingHorizontal: 16, minHeight: 52 },
  separator: { height: hairline, backgroundColor: colors.separator, marginLeft: 16 },
  wachtwoordRij: { flexDirection: 'row', alignItems: 'center' },
  oog: { paddingHorizontal: 16, height: 52, justifyContent: 'center' },
  fout: { ...type.footnote, color: colors.danger, marginHorizontal: 16, marginTop: 8, marginBottom: 12, minHeight: 18 },
  link: { alignItems: 'center', marginTop: 20 },
});
