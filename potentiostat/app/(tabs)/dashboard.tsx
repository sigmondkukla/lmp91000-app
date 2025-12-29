import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Button, Card, Divider, Text, useTheme, SegmentedButtons, IconButton } from 'react-native-paper';
import { CartesianChart, Line } from 'victory-native';
import { useBle } from '@/contexts/BleContext';
import { Buffer } from 'buffer';
import CVConfigForm, { CVParams } from '@/components/CVConfigForm';
import SWVConfigForm, { SWVParams } from '@/components/SWVConfigForm';
import DPVConfigForm, { DPVParams } from '@/components/DPVConfigForm';
import CAConfigForm, { CAParams } from '@/components/CAConfigForm';
import { packCVConfig, packSWVConfig, packDPVConfig, packCAConfig } from '@/ble/ExperimentConfig';
import { PotentiostatService } from '@/constants/gatt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// 1. Store Raw Data, not just X/Y
type RawDataPoint = {
    time: number;    // ms
    voltage: number; // mV
    current: number; // uA or A
};

type AxisOption = 'time' | 'voltage' | 'current';

export default function DashboardScreen() {
    const theme = useTheme();
    const { connectedDevice } = useBle();

    // ------------------------------------------------
    // State
    // ------------------------------------------------
    const [experimentType, setExperimentType] = useState('cv');
    const [isRunning, setIsRunning] = useState(false);

    // Store full dataset
    const [chartData, setChartData] = useState<RawDataPoint[]>([]);

    // Axis Selection State
    const [xKey, setXKey] = useState<AxisOption>('voltage');
    const [yKey, setYKey] = useState<AxisOption>('current');
    const [showGraphSettings, setShowGraphSettings] = useState(false);

    // Configuration State
    const [configParams, setConfigParams] = useState<any>(null);

    // ------------------------------------------------
    // Helpers
    // ------------------------------------------------

    // Reset defaults when experiment type changes
    const handleTypeChange = (newType: string) => {
        setExperimentType(newType);
        if (newType === 'cv') {
            setXKey('voltage');
            setYKey('current');
        } else {
            // Standard for Time-based experiments (CA, SWV, etc)
            setXKey('time');
            setYKey('current');
        }
    };

    // ------------------------------------------------
    // BLE Logic
    // ------------------------------------------------
    const subscriptionRef = useRef<any>(null);

    const handleStart = async () => {
        if (!connectedDevice || !configParams) return;

        try {
            let configBuffer: Buffer | null = null;

            if (experimentType === 'cv') {
                const p = configParams as CVParams;
                configBuffer = packCVConfig(
                    p.init_e, p.vertex_1, p.vertex_2, p.scan_rate,
                    p.scans, p.quiet_time, p.scan_delay
                );
            }
            else if (experimentType === 'swv') {
                const p = configParams as SWVParams;
                configBuffer = packSWVConfig(
                    p.init_e, p.final_e, p.incr_e, p.amplitude, p.frequency, p.quiet_time
                );
            }
            else if (experimentType === 'dpv') {
                const p = configParams as DPVParams;
                configBuffer = packDPVConfig(
                    p.init_e, p.final_e, p.incr_e, p.amplitude, p.frequency, p.quiet_time, p.duty_cycle
                );
            }
            else if (experimentType === 'ca') {
                const p = configParams as CAParams;
                configBuffer = packCAConfig(
                    p.init_e, p.quiet_time,
                    p.e_1, p.duration_1,
                    p.e_2, p.duration_2,
                    p.e_3, p.duration_3,
                    p.final_e
                );
            }

            if (!configBuffer) {
                console.warn("Packing Failed");
                return;
            }

            // ... Write Characteristic logic ...

        } catch (e) {
            console.error(e);
        }
    };

    const handleStop = async () => {
        if (!connectedDevice) return;
        try {
            await connectedDevice.writeCharacteristicWithResponseForService(
                PotentiostatService.POTENTIOSTAT_SERVICE_UUID,
                PotentiostatService.CONTROL_CHARACTERISTIC_UUID,
                'AA==' // 0x00 Stop
            );
        } catch (e) { console.error(e); }

        setIsRunning(false);
        if (subscriptionRef.current) {
            subscriptionRef.current.remove();
            subscriptionRef.current = null;
        }
    };

    const startMonitoring = () => {
        if (!connectedDevice) return;

        subscriptionRef.current = connectedDevice.monitorCharacteristicForService(
            PotentiostatService.POTENTIOSTAT_SERVICE_UUID,
            PotentiostatService.RESULTS_CHARACTERISTIC_UUID,
            (error, char) => {
                if (error || !char?.value) return;

                const buffer = Buffer.from(char.value, 'base64');
                const points: RawDataPoint[] = [];

                // 12 bytes per packet: [Time(4) | Volt(4) | Curr(4)]
                for (let i = 0; i < buffer.length; i += 12) {
                    if (i + 12 > buffer.length) break;

                    const t = buffer.readUInt32LE(i);
                    const v = buffer.readInt32LE(i + 4);
                    const c = buffer.readFloatLE(i + 8);

                    // Store raw 3-tuple
                    points.push({ time: t, voltage: v, current: c });
                }

                setChartData(prev => [...prev, ...points]);
            }
        );
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (subscriptionRef.current) subscriptionRef.current.remove();
        };
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header elevated statusBarHeight={0}>
                <Appbar.BackAction onPress={() => { router.back() }}></Appbar.BackAction>
                <Appbar.Content title="Experiment" />
                <Appbar.Action icon={connectedDevice ? "bluetooth-connect" : "bluetooth-off"} onPress={() => { router.navigate('/') }} />
                <Appbar.Action icon="chart-box-outline" onPress={() => setShowGraphSettings(!showGraphSettings)} />
            </Appbar.Header>

            {/* Graph Settings Overlay */}
            {showGraphSettings && (
                <View style={[styles.graphSettings, { backgroundColor: theme.colors.elevation.level2 }]}>
                    <Text variant="labelMedium" style={{ marginBottom: 4 }}>X Axis</Text>
                    <SegmentedButtons
                        value={xKey}
                        onValueChange={val => setXKey(val as AxisOption)}
                        buttons={[
                            { value: 'time', label: 'Time' },
                            { value: 'voltage', label: 'Voltage' },
                            { value: 'current', label: 'Current' },
                        ]}
                        density="small"
                        style={{ marginBottom: 8 }}
                    />
                    <Text variant="labelMedium" style={{ marginBottom: 4 }}>Y Axis</Text>
                    <SegmentedButtons
                        value={yKey}
                        onValueChange={val => setYKey(val as AxisOption)}
                        buttons={[
                            { value: 'time', label: 'Time' },
                            { value: 'voltage', label: 'Voltage' },
                            { value: 'current', label: 'Current' },
                        ]}
                        density="small"
                    />
                </View>
            )}

            <View style={styles.chartContainer}>
                {/* Dynamic Chart */}
                <CartesianChart
                    data={chartData}
                    xKey={xKey}   // <--- Dynamic X
                    yKeys={[yKey]} // <--- Dynamic Y
                    padding={16}
                >
                    {({ points }) => (
                        <Line
                            points={points[yKey]} // <--- Read specific Y key points
                            color={theme.colors.primary}
                            strokeWidth={2}
                            animate={{ type: "timing", duration: 0 }}
                        />
                    )}
                </CartesianChart>

                <Text style={styles.axisLabelX}>{xKey.toUpperCase()}</Text>
                <Text style={styles.axisLabelY}>{yKey.toUpperCase()}</Text>

                {chartData.length === 0 && (
                    <View style={styles.chartPlaceholder}>
                        <Text>No Data</Text>
                    </View>
                )}
            </View>

            <Divider />

            <ScrollView style={styles.controls}>
                <SegmentedButtons
                    value={experimentType}
                    onValueChange={handleTypeChange}
                    buttons={[
                        { value: 'cv', label: 'CV' },
                        { value: 'swv', label: 'SWV' },
                        { value: 'dpv', label: 'DPV' },
                        { value: 'ca', label: 'CA' },
                    ]}
                    style={styles.segmented}
                />

                <Card mode="outlined" style={styles.configCard}>
                    <Card.Content>
                        {/* Dynamically render the correct form */}
                        {experimentType === 'cv' && (
                            <CVConfigForm onChange={setConfigParams} />
                        )}
                        {experimentType === 'swv' && (
                            <SWVConfigForm onChange={setConfigParams} />
                        )}
                        {experimentType === 'dpv' && (
                            <DPVConfigForm onChange={setConfigParams} />
                        )}
                        {experimentType === 'ca' && (
                            <CAConfigForm onChange={setConfigParams} />
                        )}
                    </Card.Content>
                </Card>

                <View style={styles.actionButtons}>
                    <Button
                        mode="contained"
                        icon="play"
                        onPress={handleStart}
                        // Disable if running OR if configParams is null (form invalid)
                        disabled={isRunning || !connectedDevice || !configParams}
                        contentStyle={{ height: 48 }}
                    >
                        Start Experiment
                    </Button>

                    <Button
                        mode="outlined"
                        icon="download"
                        onPress={() => console.log("Export CSV")}
                        disabled={chartData.length === 0}
                    >
                        Export CSV
                    </Button>
                </View>
                <View style={{ height: 20 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    graphSettings: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    chartContainer: {
        height: 300,
        backgroundColor: '#00000010',
        position: 'relative',
    },
    chartPlaceholder: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    axisLabelX: {
        position: 'absolute',
        bottom: 4,
        right: 8,
        fontSize: 10,
        opacity: 0.5,
    },
    axisLabelY: {
        position: 'absolute',
        top: 4,
        left: 8,
        fontSize: 10,
        opacity: 0.5,
    },
    controls: {
        flex: 1,
        padding: 16,
    },
    segmented: {
        marginBottom: 16,
    },
    configCard: {
        marginBottom: 20,
    },
    actionButtons: {
        gap: 12,
    }
});