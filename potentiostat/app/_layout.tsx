import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaperTheme from '@/components/PaperTheme'; // Use your existing file
import { BleProvider } from '@/contexts/BleContext'; // New Context

export default function Layout() {
  const paperTheme = PaperTheme();

  return (
    <PaperProvider theme={paperTheme}>
      <BleProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: paperTheme.colors.background }}>
           {/* Stack points to (tabs) folder as the initial route */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SafeAreaView>
      </BleProvider>
    </PaperProvider>
  );
}