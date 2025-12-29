import React, { useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Appbar, List, Switch, Text, Divider, Button, useTheme } from 'react-native-paper';
import { useBle } from '@/contexts/BleContext';

export default function SettingsScreen() {
  const theme = useTheme();
  const { requestPermissions } = useBle();
  
  // Note: ble-plx handles enabling BT automatically on most Android versions during scan,
  // but we can add a manual permissions check button.

  const openSystemSettings = () => {
    Linking.openSettings();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <View style={styles.content}>
        <List.Section>
          <List.Subheader>Permissions</List.Subheader>
          <List.Item
            title="Bluetooth Permissions"
            description="Required to scan and connect"
            left={props => <List.Icon {...props} icon="shield-check" />}
            right={props => <Button mode="text" onPress={requestPermissions}>Check</Button>}
          />
          <List.Item
            title="System Settings"
            description="Open app settings to manage permissions manually"
            left={props => <List.Icon {...props} icon="cog" />}
            onPress={openSystemSettings}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="App Version"
            description="1.0.0 (Expo Router + BLE PLX)"
            left={props => <List.Icon {...props} icon="information" />}
          />
        </List.Section>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  }
});