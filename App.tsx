import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/auth';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { GebruikersScreen } from './src/screens/GebruikersScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { NieuweMeldingScreen } from './src/screens/NieuweMeldingScreen';
import { OverzichtScreen } from './src/screens/OverzichtScreen';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/types';

// Een "stack" is een stapel schermen: een nieuw scherm komt bovenop de stapel,
// en met terug haal je het bovenste scherm er weer af.
const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigatie() {
  const { medewerker, laden } = useAuth();

  // Bij het opstarten kijkt de app eerst of je nog ingelogd was. Zolang dat
  // bezig is laten we een laad-rondje zien.
  if (laden) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Niet ingelogde gebruikers zien alleen het inlogscherm; de meldingschermen
  // bestaan dan niet in de navigatie.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {medewerker ? (
        <>
          <Stack.Screen name="Overzicht" component={OverzichtScreen} />
          <Stack.Screen
            name="NieuweMelding"
            component={NieuweMeldingScreen}
            options={{ presentation: 'modal', headerBackButtonMenuEnabled: false }}
          />
          <Stack.Screen name="Details" component={DetailsScreen} />
          {medewerker.rol === 'admin' && <Stack.Screen name="Gebruikers" component={GebruikersScreen} />}
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

// De "providers" liggen als lagen om de hele app heen. Alles wat erbinnen staat
// kan erbij: SafeAreaProvider weet waar de notch zit, AuthProvider weet wie er
// ingelogd is en NavigationContainer regelt het wisselen van schermen.
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Navigatie />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
