import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { BleManager, Device, BleError } from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";

interface BleContextProps {
  manager: BleManager;
  scannedDevices: Map<string, Device>;
  startScan: () => void;
  stopScan: () => void;
  isScanning: boolean;
  connectedDevice: Device | null;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

const BleContext = createContext<BleContextProps>({} as BleContextProps);

const bleManager = new BleManager();

export const BleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scannedDevices, setScannedDevices] = useState(new Map<string, Device>());
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  // Helper for Android Permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true; // iOS handles this automatically
  };

  const startScan = async () => {
    const hasPerms = await requestPermissions();
    if (!hasPerms) {
        console.warn("Bluetooth permissions denied");
        return;
    }

    if (isScanning) return;
    
    setScannedDevices(new Map()); // Clear old list
    setIsScanning(true);

    bleManager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.error("Scan error:", error);
        setIsScanning(false);
        return;
      }
      // Filter out devices with no name to keep list clean
      if (device && (device.name || device.localName)) { 
        setScannedDevices((prev) => new Map(prev).set(device.id, device));
      }
    });
  };

  const stopScan = () => {
    bleManager.stopDeviceScan();
    setIsScanning(false);
  };

  const connectToDevice = async (device: Device) => {
    stopScan(); // Always stop scanning before connecting
    try {
      const connected = await device.connect();
      // Required for Android to discover the UUIDs
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      console.log("Connected to", connected.name);
    } catch (error) {
      console.error("Connection failed", error);
      throw error;
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bleManager.destroy();
    };
  }, []);

  return (
    <BleContext.Provider
      value={{
        manager: bleManager,
        scannedDevices,
        startScan,
        stopScan,
        isScanning,
        connectedDevice,
        connectToDevice,
        disconnectDevice,
        requestPermissions
      }}
    >
      {children}
    </BleContext.Provider>
  );
};

export const useBle = () => useContext(BleContext);