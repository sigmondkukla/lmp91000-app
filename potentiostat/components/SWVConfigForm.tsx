import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text } from 'react-native-paper';

export interface SWVParams {
  init_e: number;
  final_e: number;
  incr_e: number;
  amplitude: number;
  frequency: number;
  quiet_time: number;
}

interface Props {
  onChange: (params: SWVParams | null) => void;
}

export default function SWVConfigForm({ onChange }: Props) {
  const [initE, setInitE] = useState('0');
  const [finalE, setFinalE] = useState('500');
  const [incrE, setIncrE] = useState('5'); // Step size
  const [amplitude, setAmplitude] = useState('25');
  const [frequency, setFrequency] = useState('10'); // Hz
  const [quietTime, setQuietTime] = useState('1000');

  useEffect(() => {
    if (!initE || !finalE || !incrE || !amplitude || !frequency) {
      onChange(null);
      return;
    }
    onChange({
      init_e: parseInt(initE),
      final_e: parseInt(finalE),
      incr_e: parseInt(incrE),
      amplitude: parseInt(amplitude),
      frequency: parseInt(frequency),
      quiet_time: parseInt(quietTime),
    });
  }, [initE, finalE, incrE, amplitude, frequency, quietTime]);

  return (
    <View style={styles.container}>
      <Text variant="titleSmall" style={styles.header}>Sweep Range (mV)</Text>
      <View style={styles.row}>
        <TextInput mode="outlined" label="Start" value={initE} onChangeText={setInitE} keyboardType="numeric" style={styles.input} dense />
        <TextInput mode="outlined" label="End" value={finalE} onChangeText={setFinalE} keyboardType="numeric" style={styles.input} dense />
        <TextInput mode="outlined" label="Step" value={incrE} onChangeText={setIncrE} keyboardType="numeric" style={styles.input} dense />
      </View>

      <Text variant="titleSmall" style={styles.header}>Pulse Parameters</Text>
      <View style={styles.row}>
        <TextInput mode="outlined" label="Amplitude" value={amplitude} onChangeText={setAmplitude} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="mV" />} />
        <TextInput mode="outlined" label="Frequency" value={frequency} onChangeText={setFrequency} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="Hz" />} />
      </View>
      
      <TextInput mode="outlined" label="Quiet Time" value={quietTime} onChangeText={setQuietTime} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="ms" />} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  header: { opacity: 0.7, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1 },
});