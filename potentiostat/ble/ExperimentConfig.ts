// src/ble/ExperimentConfig.ts
import { Buffer } from 'buffer';

export enum ExperimentType {
    CV = 0x01,
    SWV = 0x02,
    DPV = 0x03,
    CA = 0x04
}

// 1. Cyclic Voltammetry
export const packCVConfig = (
    init_e: number, vertex_1: number, vertex_2: number,
    scan_rate: number, scans: number, quiet_time: number, scan_delay: number
): Buffer => {
    const buffer = Buffer.alloc(32); // Matches sizeof(CVConfig)
    let offset = 0;

    buffer.writeUInt32LE(ExperimentType.CV, offset); offset += 4;
    buffer.writeInt32LE(init_e, offset); offset += 4;
    buffer.writeInt32LE(vertex_1, offset); offset += 4;
    buffer.writeInt32LE(vertex_2, offset); offset += 4;
    buffer.writeUInt32LE(scan_rate, offset); offset += 4;
    buffer.writeUInt32LE(scans, offset); offset += 4;
    buffer.writeUInt32LE(quiet_time, offset); offset += 4;
    buffer.writeUInt32LE(scan_delay, offset); offset += 4;

    return buffer;
};

// 2. Square Wave Voltammetry
export const packSWVConfig = (
    init_e: number, final_e: number, incr_e: number,
    amplitude: number, frequency: number, quiet_time: number
): Buffer => {
    const buffer = Buffer.alloc(28); // Matches sizeof(SWVConfig)
    let offset = 0;

    buffer.writeUInt32LE(ExperimentType.SWV, offset); offset += 4;
    buffer.writeInt32LE(init_e, offset); offset += 4;
    buffer.writeInt32LE(final_e, offset); offset += 4;
    buffer.writeInt32LE(incr_e, offset); offset += 4;
    buffer.writeUInt32LE(amplitude, offset); offset += 4;
    buffer.writeUInt32LE(frequency, offset); offset += 4;
    buffer.writeUInt32LE(quiet_time, offset); offset += 4;

    return buffer;
};

// 3. Differential Pulse Voltammetry
export const packDPVConfig = (
    init_e: number, final_e: number, incr_e: number,
    amplitude: number, frequency: number, quiet_time: number, duty_cycle: number
): Buffer => {
    const buffer = Buffer.alloc(32); // Matches sizeof(DPVConfig)
    let offset = 0;

    buffer.writeUInt32LE(ExperimentType.DPV, offset); offset += 4;
    buffer.writeInt32LE(init_e, offset); offset += 4;
    buffer.writeInt32LE(final_e, offset); offset += 4;
    buffer.writeInt32LE(incr_e, offset); offset += 4;
    buffer.writeUInt32LE(amplitude, offset); offset += 4;
    buffer.writeUInt32LE(frequency, offset); offset += 4;
    buffer.writeUInt32LE(quiet_time, offset); offset += 4;
    buffer.writeFloatLE(duty_cycle, offset); offset += 4; // Float!

    return buffer;
};

// 4. Chronoamperometry
export const packCAConfig = (
    init_e: number, quiet_time: number,
    e_1: number, duration_1: number,
    e_2: number, duration_2: number,
    e_3: number, duration_3: number,
    final_e: number
): Buffer => {
    const buffer = Buffer.alloc(40); // Matches sizeof(CAConfig)
    let offset = 0;

    buffer.writeUInt32LE(ExperimentType.CA, offset); offset += 4;
    buffer.writeInt32LE(init_e, offset); offset += 4;
    buffer.writeUInt32LE(quiet_time, offset); offset += 4;
    buffer.writeInt32LE(e_1, offset); offset += 4;
    buffer.writeUInt32LE(duration_1, offset); offset += 4;
    buffer.writeInt32LE(e_2, offset); offset += 4;
    buffer.writeUInt32LE(duration_2, offset); offset += 4;
    buffer.writeInt32LE(e_3, offset); offset += 4;
    buffer.writeUInt32LE(duration_3, offset); offset += 4;
    buffer.writeInt32LE(final_e, offset); offset += 4;

    return buffer;
};