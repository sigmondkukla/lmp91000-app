import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text } from 'react-native-paper';

export interface DPVParams {
  init_e: number;
  final_e: number;
  incr_e: number;
  amplitude: number;
  frequency: number;
  quiet_time: number;
  duty_cycle: number; // Float 0.0 - 1.0
}

interface Props {
  onChange: (params: DPVParams | null) => void;
}

export default function DPVConfigForm({ onChange }: Props) {
  const [initE, setInitE] = useState('0');
  const [finalE, setFinalE] = useState('500');
  const [incrE, setIncrE] = useState('5');
  const [amplitude, setAmplitude] = useState('50');
  const [frequency, setFrequency] = useState('10');
  const [dutyCycle, setDutyCycle] = useState('50'); // Percentage
  const [quietTime, setQuietTime] = useState('1000');

  useEffect(() => {
    if (!initE || !finalE || !amplitude || !frequency || !dutyCycle) {
      onChange(null);
      return;
    }
    
    // Convert Percentage (50) to Float (0.5)
    const dutyFloat = parseFloat(dutyCycle) / 100.0;

    onChange({
      init_e: parseInt(initE),
      final_e: parseInt(finalE),
      incr_e: parseInt(incrE),
      amplitude: parseInt(amplitude),
      frequency: parseInt(frequency),
      quiet_time: parseInt(quietTime),
      duty_cycle: dutyFloat, 
    });
  }, [initE, finalE, incrE, amplitude, frequency, dutyCycle, quietTime]);

  return (
    <View style={styles.container}>
      <Text variant="titleSmall" style={styles.header}>Sweep (mV)</Text>
      <View style={styles.row}>
        <TextInput mode="outlined" label="Start" value={initE} onChangeText={setInitE} keyboardType="numeric" style={styles.input} dense />
        <TextInput mode="outlined" label="End" value={finalE} onChangeText={setFinalE} keyboardType="numeric" style={styles.input} dense />
        <TextInput mode="outlined" label="Step" value={incrE} onChangeText={setIncrE} keyboardType="numeric" style={styles.input} dense />
      </View>

      <Text variant="titleSmall" style={styles.header}>Pulse Settings</Text>
      <View style={styles.row}>
        <TextInput mode="outlined" label="Amp" value={amplitude} onChangeText={setAmplitude} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="mV" />} />
        <TextInput mode="outlined" label="Freq" value={frequency} onChangeText={setFrequency} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="Hz" />} />
        <TextInput mode="outlined" label="Duty" value={dutyCycle} onChangeText={setDutyCycle} keyboardType="numeric" style={styles.input} dense right={<TextInput.Affix text="%" />} />
      </View>
      
      <TextInput mode="outlined" label="Quiet Time (ms)" value={quietTime} onChangeText={setQuietTime} keyboardType="numeric" style={{marginTop: 8}} dense />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  header: { opacity: 0.7, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1 },
});