import React, { useEffect, useState, useRef } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Appbar, Button, Card, Divider, Text, useTheme, SegmentedButtons, IconButton, Snackbar, Portal } from 'react-native-paper';
import { CartesianChart, Line } from 'victory-native';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useBle } from '@/contexts/BleContext';
import CVConfigForm, { CVParams } from '@/components/CVConfigForm';
import SWVConfigForm, { SWVParams } from '@/components/SWVConfigForm';
import DPVConfigForm, { DPVParams } from '@/components/DPVConfigForm';
import CAConfigForm, { CAParams } from '@/components/CAConfigForm';
import { packCVConfig, packSWVConfig, packDPVConfig, packCAConfig } from '@/ble/ExperimentConfig';
import { Buffer } from 'buffer';
import { ExperimentService } from '@/constants/gatt';

type DataPoint = {
    time: number;    // ms
    voltage: number; // mV
    current: number; // A
};

type AxisOption = 'time' | 'voltage' | 'current';

export default function DashboardScreen() {
    // UI state
    const theme = useTheme();
    const [snackBarVisible, setSnackBarVisible] = React.useState(false);
    const [snackBarMessage, setSnackBarMessage] = React.useState("");

    // BLE state
    const { connectedDevice } = useBle();
    const resultsSubscriptionRef = useRef<any>(null);
    const controlSubscriptionRef = useRef<any>(null);

    const [experimentType, setExperimentType] = useState('cv'); // 'cv' | 'swv' | 'dpv' | 'ca' current tab
    const [isRunning, setIsRunning] = useState(false); // experiment running state, can be updated from BLE
    const [results, setResults] = useState<DataPoint[]>([]); // stores all data points

    // axis options
    const [xKey, setXKey] = useState<AxisOption>('voltage');
    const [yKey, setYKey] = useState<AxisOption>('current');
    const [showAxisOptions, setShowAxisOptions] = useState(false);

    const [configParams, setConfigParams] = useState<any>(null); // experiment configuration

    const changeExperimentType = (newType: string) => {
        setExperimentType(newType); // sets experiment type state
        switch (newType) { // updates graph axis defaults based on common usage for each type
            case 'ca': // CA monitors current over time
                setXKey('time');
                setYKey('current');
                break;
            default: // most others incl CV, SWV, DPV use voltage vs current
                setXKey('voltage');
                setYKey('current');
        }
    };

    const handleApply = async () => {
        if (!connectedDevice || !configParams) return;

        try {
            // 1. Pack Configuration
            let configBuffer: Buffer | null = null;

            switch (experimentType) {
                case 'cv':
                    const cv_params = configParams as CVParams;
                    configBuffer = packCVConfig(
                        cv_params.init_e, cv_params.vertex_1, cv_params.vertex_2, cv_params.scan_rate,
                        cv_params.scans, cv_params.quiet_time, cv_params.scan_delay
                    );
                    break;
                case 'swv':
                    const swv_params = configParams as SWVParams;
                    configBuffer = packSWVConfig(
                        swv_params.init_e, swv_params.final_e, swv_params.incr_e, swv_params.amplitude, swv_params.frequency, swv_params.quiet_time
                    );
                    break;
                case 'dpv':
                    const dpv_params = configParams as DPVParams;
                    configBuffer = packDPVConfig(
                        dpv_params.init_e, dpv_params.final_e, dpv_params.incr_e, dpv_params.amplitude, dpv_params.frequency, dpv_params.quiet_time, dpv_params.duty_cycle
                    );
                    break;
                case 'ca':
                    const ca_params = configParams as CAParams;
                    configBuffer = packCAConfig(
                        ca_params.init_e, ca_params.quiet_time,
                        ca_params.e_1, ca_params.duration_1,
                        ca_params.e_2, ca_params.duration_2,
                        ca_params.e_3, ca_params.duration_3,
                        ca_params.final_e
                    );
                    break;
                default:
                    console.error("Unknown experiment type selected");
            }

            if (!configBuffer) {
                console.error("Packing Failed");
                return;
            }

            console.log("Applying configuration for", experimentType);

            // write configuration
            await connectedDevice.writeCharacteristicWithResponseForService(
                ExperimentService.EXPERIMENT_SERVICE_UUID,
                ExperimentService.EXPERIMENT_CONFIG_UUID,
                configBuffer.toString('base64')
            );

        } catch (e) {
            console.error("Apply config failed: ", e);
        }
    };

    const subscribeExperimentResults = () => {
        if (!connectedDevice) return;

        resultsSubscriptionRef.current = connectedDevice.monitorCharacteristicForService(
            ExperimentService.EXPERIMENT_SERVICE_UUID,
            ExperimentService.EXPERIMENT_RESULTS_UUID,
            (error, char) => {
                if (error || !char?.value) return;

                const buffer = Buffer.from(char.value, 'base64');
                const points: DataPoint[] = [];

                // 12 bytes per packet: time (4 bytes), voltage (4 bytes), current (4 bytes)
                for (let i = 0; i < buffer.length; i += 12) {
                    if (i + 12 > buffer.length) break;

                    const t = buffer.readUInt32LE(i);
                    const v = buffer.readInt32LE(i + 4);
                    const c = buffer.readFloatLE(i + 8);

                    points.push({ time: t, voltage: v, current: c }); // store as a tuple
                }

                setResults(prev => [...prev, ...points]);
            }
        );
    };

    const subscribeExperimentStatus = () => {
        if (!connectedDevice) return;

        controlSubscriptionRef.current = connectedDevice.monitorCharacteristicForService(
            ExperimentService.EXPERIMENT_SERVICE_UUID,
            ExperimentService.EXPERIMENT_STATUS_UUID,
            (error, char) => {
                if (error || !char?.value) return;

                const buffer = Buffer.from(char.value, 'base64');
                const statusByte = buffer.readUInt8(0);

                console.log("Control status byte:", statusByte);

                const running = (statusByte & 0x01) !== 0;

                setIsRunning(running);
            }
        );
    };

    const handleStart = async () => {
        if (!connectedDevice) return;
        try {
            setResults([]); // clear prior experiment data
            subscribeExperimentResults(); // to get data points
            subscribeExperimentStatus(); // to get running state updates

            await connectedDevice.writeCharacteristicWithResponseForService(
                ExperimentService.EXPERIMENT_SERVICE_UUID,
                ExperimentService.EXPERIMENT_STATUS_UUID,
                'AQ==' // 0x01 start
            );
        } catch (e) { console.error(e); }
    };


    const handleStop = async () => {
        if (!connectedDevice) return;
        try {
            await connectedDevice.writeCharacteristicWithResponseForService(
                ExperimentService.EXPERIMENT_SERVICE_UUID,
                ExperimentService.EXPERIMENT_STATUS_UUID,
                'AA==' // 0x00 stop
            );
        } catch (e) { console.error(e); }

        if (resultsSubscriptionRef.current) {
            resultsSubscriptionRef.current.remove();
            resultsSubscriptionRef.current = null;
        }
        if (controlSubscriptionRef.current) {
            controlSubscriptionRef.current.remove();
            controlSubscriptionRef.current = null;
        }
    };

    const exportCSV = async () => {
        if (results.length === 0) return;

        try {
            const header = "Time (ms),Voltage (mV),Current (uA)\n";
            const rows = results.map(dp => `${dp.time},${dp.voltage},${dp.current}`).join("\n");
            const csvString = header + rows;

            const fileName = `potentiostat_${Date.now()}.csv`;
            const file = new File(Paths.cache, fileName);
            file.create();
            file.write(csvString);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(file.uri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export results',
                    UTI: 'public.comma-separated-values-text' // iOS
                });
            } else {
                console.warn("Sharing not available");
            }

        } catch (error) {
            console.error("Error exporting CSV:", error);
        }
    };

    // cleanup subscriptions on unmount
    useEffect(() => {
        return () => {
            if (resultsSubscriptionRef.current) resultsSubscriptionRef.current.remove();
            if (controlSubscriptionRef.current) controlSubscriptionRef.current.remove();
        };
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => { router.back() }}></Appbar.BackAction>
                <Appbar.Content title="Experiment" />
                <Appbar.Action icon={connectedDevice ? "bluetooth-connect" : "bluetooth-off"} onPress={() => { router.navigate('/') }} />
                <Appbar.Action icon="chart-box-outline" onPress={() => setShowAxisOptions(!showAxisOptions)} />
            </Appbar.Header>

            {showAxisOptions && (
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

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <ScrollView>
                    <View style={styles.chartContainer}>
                        <CartesianChart
                            data={results}
                            xKey={xKey}
                            yKeys={[yKey]}
                            padding={16}
                        >
                            {({ points }) => (
                                <Line
                                    points={points[yKey]}
                                    color={theme.colors.primary}
                                    strokeWidth={2}
                                    animate={{ type: "timing", duration: 100 }}
                                />
                            )}
                        </CartesianChart>

                        <Text style={styles.axisLabelX}>{xKey.toUpperCase()}</Text>
                        <Text style={styles.axisLabelY}>{yKey.toUpperCase()}</Text>

                        {results.length === 0 && (
                            <View style={styles.chartPlaceholder}>
                                <Text>No Data</Text>
                            </View>
                        )}
                    </View>

                    <Divider />


                    <View style={styles.controls}>
                        <SegmentedButtons
                            value={experimentType}
                            onValueChange={changeExperimentType}
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
                                mode = "contained"
                                icon="check"
                                onPress={handleApply}
                                disabled={isRunning || !connectedDevice || !configParams}
                            >
                                Apply
                            </Button>

                            <Button
                                mode="contained"
                                icon={isRunning ? "stop" : "play"}
                                onPress={isRunning ? handleStop : handleStart}
                                disabled={!connectedDevice || !configParams}
                            >
                                {isRunning ? "Stop" : "Start"}
                            </Button>

                            <Button
                                mode="outlined"
                                icon="file-excel-outline"
                                onPress={() => exportCSV()}
                                disabled={results.length === 0}
                            >
                                Export CSV
                            </Button>
                        </View>
                    </View>
                </ScrollView>
                <Portal>
                    <Snackbar
                        visible={snackBarVisible}
                        onDismiss={() => setSnackBarVisible(false)}
                        action={{
                            label: "Dismiss",
                            onPress: () => {
                                setSnackBarVisible(false);
                            },
                        }}
                    >
                        {snackBarMessage}
                    </Snackbar>
                </Portal>
            </KeyboardAvoidingView>
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