import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text, Divider } from 'react-native-paper';

export interface CAParams {
  init_e: number;
  quiet_time: number;
  e_1: number;
  duration_1: number;
  e_2: number;
  duration_2: number;
  e_3: number;
  duration_3: number;
  final_e: number;
}

interface Props {
  onChange: (params: CAParams | null) => void;
}

export default function CAConfigForm({ onChange }: Props) {
  // Pre-Experiment
  const [initE, setInitE] = useState('0');
  const [quietTime, setQuietTime] = useState('1000');
  
  // Step 1
  const [e1, setE1] = useState('500');
  const [d1, setD1] = useState('5000');

  // Step 2
  const [e2, setE2] = useState('-500');
  const [d2, setD2] = useState('5000');

  // Step 3 (Optional usually, but struct requires it. Set duration 0 to skip)
  const [e3, setE3] = useState('0');
  const [d3, setD3] = useState('0');

  // Post-Experiment
  const [finalE, setFinalE] = useState('0');

  useEffect(() => {
    // Basic validation
    if (!initE || !quietTime || !e1 || !d1) {
      onChange(null);
      return;
    }

    onChange({
      init_e: parseInt(initE),
      quiet_time: parseInt(quietTime),
      e_1: parseInt(e1),
      duration_1: parseInt(d1),
      e_2: parseInt(e2),
      duration_2: parseInt(d2),
      e_3: parseInt(e3),
      duration_3: parseInt(d3),
      final_e: parseInt(finalE),
    });
  }, [initE, quietTime, e1, d1, e2, d2, e3, d3, finalE]);

  return (
    <View style={styles.container}>
      {/* Initialization */}
      <Text variant="titleSmall" style={styles.header}>Initialization</Text>
      <View style={styles.row}>
        <TextInput mode="outlined" label="Init E" value={initE} onChangeText={setInitE} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="mV" />} />
        <TextInput mode="outlined" label="Quiet Time" value={quietTime} onChangeText={setQuietTime} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="ms" />} />
      </View>

      <Divider style={styles.divider} />

      {/* Step 1 */}
      <Text variant="titleSmall" style={styles.header}>Step 1</Text>
      <View style={styles.row}>
        <TextInput mode="outlined" label="Voltage 1" value={e1} onChangeText={setE1} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="mV" />} />
        <TextInput mode="outlined" label="Duration 1" value={d1} onChangeText={setD1} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="ms" />} />
      </View>

      {/* Step 2 */}
      <Text variant="titleSmall" style={styles.header}>Step 2</Text>
      <View style={styles.row}>
        <TextInput mode="outlined" label="Voltage 2" value={e2} onChangeText={setE2} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="mV" />} />
        <TextInput mode="outlined" label="Duration 2" value={d2} onChangeText={setD2} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="ms" />} />
      </View>

      {/* Step 3 */}
      <Text variant="titleSmall" style={styles.header}>Step 3 (Set Duration 0 to skip)</Text>
      <View style={styles.row}>
        <TextInput mode="outlined" label="Voltage 3" value={e3} onChangeText={setE3} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="mV" />} />
        <TextInput mode="outlined" label="Duration 3" value={d3} onChangeText={setD3} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="ms" />} />
      </View>

      <Divider style={styles.divider} />

      {/* Final */}
      <TextInput mode="outlined" label="Final Voltage (Safety)" value={finalE} onChangeText={setFinalE} keyboardType="numeric" dense right={<TextInput.Affix text="mV" />} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  header: { opacity: 0.7, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1 },
  divider: { marginVertical: 8 }
});