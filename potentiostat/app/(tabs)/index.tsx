import React, { useState } from 'react';
import { View, StyleSheet, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Banner, Button, Card, Icon, Portal, Snackbar, Text, useTheme } from 'react-native-paper';
import { Device } from 'react-native-ble-plx';
import { useBle } from '@/contexts/BleContext';
import { useRouter } from 'expo-router';

export default function ScannerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { scannedDevices, isScanning, startScan, stopScan, connectToDevice, connectedDevice } = useBle();

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = async (device: Device) => {
    setConnectingId(device.id);
    try {
      await connectToDevice(device);
      setSnackbarMessage(`Connected to ${device.name || 'Device'}`);
      setSnackbarVisible(true);
      // Auto-navigate to dashboard after successful connection
      router.push('/dashboard');
    } catch (e) {
      setSnackbarMessage(`Failed to connect: ${(e as Error).message}`);
      setSnackbarVisible(true);
    } finally {
      setConnectingId(null);
    }
  };

  const renderItem = ({ item }: { item: Device }) => {
    const isConnected = connectedDevice?.id === item.id;
    const isConnecting = connectingId === item.id;

    return (
      <Card style={styles.card}>
        <Card.Title
          title={item.name || item.localName || 'Unknown Device'}
          subtitle={item.id}
          left={(props) => <Icon source="bluetooth" size={30} color={theme.colors.primary} />}
        />
        <Card.Content>
          <Text variant="bodyMedium">RSSI: {item.rssi}</Text>
        </Card.Content>
        <Card.Actions>
          <Button
            mode={isConnected ? "outlined" : "contained"}
            onPress={() => isConnected ? router.push('/dashboard') : handleConnect(item)}
            loading={isConnecting}
            disabled={isConnecting}
          >
            {isConnected ? "Go to Experiment" : isConnecting ? "Connecting..." : "Connect"}
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => { router.back() }} />
        <Appbar.Content title="Connection" />
        <Appbar.Action icon={isScanning ? "stop" : "magnify"} onPress={isScanning ? stopScan : startScan} />
      </Appbar.Header>
      <Portal.Host>
        <View style={styles.content}>

          <View style={styles.headerActions}>
            <Button
              icon={isScanning ? "stop" : "magnify"}
              mode="contained-tonal"
              onPress={isScanning ? stopScan : startScan}
            >
              {isScanning ? 'Stop Scan' : 'Scan Bluetooth'}
            </Button>
          </View>

          <Banner
            visible={scannedDevices.size === 0 && !isScanning}
            actions={[{ label: 'Start Scan', onPress: startScan }]}
            icon={({ size }) => <Icon source="bluetooth-off" size={size} />}
          >
            No devices found. Ensure your Potentiostat is powered on.
          </Banner>

          <FlatList
            data={Array.from(scannedDevices.values())}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />

          <Portal>
            <Snackbar
              visible={snackbarVisible}
              onDismiss={() => setSnackbarVisible(false)}
              action={{ label: 'Dismiss', onPress: () => setSnackbarVisible(false) }}
            >
              {snackbarMessage}
            </Snackbar>
          </Portal>
        </View>
      </Portal.Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerActions: {
    marginVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  listContent: {
    gap: 16,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 8,
  }
});