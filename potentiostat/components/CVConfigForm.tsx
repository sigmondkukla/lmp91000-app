import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text } from 'react-native-paper';

export interface CVParams {
  init_e: number;
  vertex_1: number;
  vertex_2: number;
  scan_rate: number;
  scans: number;
  quiet_time: number;
  scan_delay: number;
}

interface Props {
  onChange: (params: CVParams | null) => void;
}

export default function CVConfigForm({ onChange }: Props) {
  // Voltages (mV)
  const [initE, setInitE] = useState('0');
  const [vertex1, setVertex1] = useState('500');
  const [vertex2, setVertex2] = useState('-500');
  
  // Timing / Speed
  const [scanRate, setScanRate] = useState('100'); // mV/s
  const [scans, setScans] = useState('1');
  const [quietTime, setQuietTime] = useState('1000'); // ms
  const [scanDelay, setScanDelay] = useState('0'); // ms

  useEffect(() => {
    // Basic Validation: Ensure strings are numbers
    if (!initE || !vertex1 || !vertex2 || !scanRate || !scans || !quietTime) {
      onChange(null);
      return;
    }

    onChange({
      init_e: parseInt(initE),
      vertex_1: parseInt(vertex1),
      vertex_2: parseInt(vertex2),
      scan_rate: parseInt(scanRate),
      scans: parseInt(scans),
      quiet_time: parseInt(quietTime),
      scan_delay: parseInt(scanDelay),
    });
  }, [initE, vertex1, vertex2, scanRate, scans, quietTime, scanDelay]);

  return (
    <View style={styles.container}>
      <Text variant="titleSmall" style={styles.header}>Voltage Parameters (mV)</Text>
      <View style={styles.row}>
        <TextInput mode="outlined" label="Init E" value={initE} onChangeText={setInitE} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="mV" />} />
        <TextInput mode="outlined" label="Vertex 1" value={vertex1} onChangeText={setVertex1} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="mV" />} />
        <TextInput mode="outlined" label="Vertex 2" value={vertex2} onChangeText={setVertex2} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="mV" />} />
      </View>

      <Text variant="titleSmall" style={styles.header}>Scan Parameters</Text>
      <View style={styles.row}>
        <TextInput mode="outlined" label="Rate" value={scanRate} onChangeText={setScanRate} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="mV/s" />} />
        <TextInput mode="outlined" label="Scans" value={scans} onChangeText={setScans} keyboardType="numeric" style={styles.input} dense />
      </View>

      <Text variant="titleSmall" style={styles.header}>Timing (ms)</Text>
      <View style={styles.row}>
        <TextInput mode="outlined" label="Quiet Time" value={quietTime} onChangeText={setQuietTime} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="ms" />} />
        <TextInput mode="outlined" label="Delay" value={scanDelay} onChangeText={setScanDelay} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="ms" />} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  header: { opacity: 0.7, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  input: { flex: 1, minWidth: '30%' },
});