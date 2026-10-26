import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/auth';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { NieuweMeldingScreen } from './src/screens/NieuweMeldingScreen';
import { OverzichtScreen } from './src/screens/OverzichtScreen';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigatie() {
  const { medewerker, laden } = useAuth();

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
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="Details" component={DetailsScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

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
