import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, PermissionsAndroid, Permission, Linking } from 'react-native';
import { Appbar, Button, Chip, Divider, Portal, Snackbar, Text, useTheme } from 'react-native-paper';
import { useBle } from '@/contexts/BleContext';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const theme = useTheme();
  const { manager } = useBle(); // Access the manager to enable Bluetooth

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Permission States
  const [scanPermission, setScanPermission] = useState(false);
  const [connectPermission, setConnectPermission] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  // 1. Check Permissions
  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      const scan = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
      const connect = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
      const location = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

      setScanPermission(scan);
      setConnectPermission(connect);
      setLocationPermission(location);
    } else {
      // iOS permissions are handled by the OS, usually assumed true if app is running
      setScanPermission(true);
      setConnectPermission(true);
      setLocationPermission(true);
    }
  };

  // 2. Request Permissions
  const requestAndroidPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted =
          result['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
          result['android.permission.BLUETOOTH_CONNECT'] === 'granted';

        if (allGranted) {
          setSnackbarMessage('Permissions granted successfully');
        } else {
          setSnackbarMessage('Some permissions were denied');
        }
        setSnackbarVisible(true);
        checkPermissions(); // Refresh UI
      } catch (err) {
        console.warn(err);
      }
    } else {
      // On iOS, open settings
      Linking.openSettings();
    }
  };

  // 3. Enable Bluetooth (ble-plx style)
  const enableBluetooth = async () => {
    if (Platform.OS === 'android') {
      try {
        await manager.enable();
        setSnackbarMessage('Bluetooth enabled successfully');
        setSnackbarVisible(true);
      } catch (error) {
        setSnackbarMessage('Failed to enable Bluetooth');
        setSnackbarVisible(true);
      }
    } else {
      setSnackbarMessage('Please enable Bluetooth in Control Center');
      setSnackbarVisible(true);
    }
  };

  // Initial Check
  useEffect(() => {
    checkPermissions();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Portal.Host>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => { router.back() }} />
          <Appbar.Content title="Settings" />
        </Appbar.Header>

        <View style={styles.content}>

          {/* Permission Group */}
          <View style={styles.group}>
            <Text variant="titleMedium">Permissions</Text>
            <Text variant="bodyMedium" style={{ marginBottom: 10 }}>
              Status of required Android permissions:
            </Text>

            <View style={styles.row}>
              <Text>Bluetooth Scan Permission</Text>
              {scanPermission ? <Chip icon="check">Granted</Chip> : <Chip icon="close" mode="outlined">Denied</Chip>}
            </View>

            <View style={styles.row}>
              <Text>Bluetooth Connect Permission</Text>
              {connectPermission ? <Chip icon="check">Granted</Chip> : <Chip icon="close" mode="outlined">Denied</Chip>}
            </View>

            <View style={styles.row}>
              <Text>Fine Location Permission</Text>
              {locationPermission ? <Chip icon="check">Granted</Chip> : <Chip icon="close" mode="outlined">Denied</Chip>}
            </View>

            <Button
              mode="contained-tonal"
              icon="security"
              onPress={requestAndroidPermissions}
            // style={{ marginTop: 10 }}
            >
              Request Permissions
            </Button>
          </View>

          <Divider style={{ marginVertical: 20 }} />

          {/* Bluetooth Group */}
          <View style={styles.group}>
            <Text variant="titleMedium">Bluetooth</Text>
            <View style={styles.row}>
              <Text>Ensure Bluetooth is on</Text>
              <Button mode="contained-tonal" icon="bluetooth" onPress={enableBluetooth}>
                Enable
              </Button>
            </View>
          </View>

        </View>

        <Portal>
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            action={{ label: 'Dismiss', onPress: () => setSnackbarVisible(false) }}
          >
            {snackbarMessage}
          </Snackbar>
        </Portal>
      </Portal.Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  group: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  }
});