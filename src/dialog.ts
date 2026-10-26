import { Alert, Platform } from 'react-native';

// Alert.alert met knoppen werkt niet in de webversie; daar vallen we terug op
// de browserdialogen zodat de app ook in de browser te demonstreren is.

export function toonMelding(titel: string, bericht: string): void {
  if (Platform.OS === 'web') window.alert(`${titel}\n\n${bericht}`);
  else Alert.alert(titel, bericht);
}

export function bevestig(titel: string, bericht: string, okLabel: string, annuleerLabel = 'Annuleren'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titel}\n\n${bericht}`));
  return new Promise((resolve) => {
    Alert.alert(
      titel,
      bericht,
      [
        { text: annuleerLabel, style: 'cancel', onPress: () => resolve(false) },
        { text: okLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
