import { Audio } from 'expo-av';
import { Vibration, Platform } from 'react-native';


// ── Tone Generation Helpers ─────────────────────────────────────────

function encodeWAV(samples: number[], sampleRate: number): string {
    const numSamples = samples.length;
    const byteRate = sampleRate * 2; // 16-bit mono
    const dataSize = numSamples * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);          // chunk size
    view.setUint16(20, 1, true);           // PCM
    view.setUint16(22, 1, true);           // mono
    view.setUint32(24, sampleRate, true);   // sample rate
    view.setUint32(28, byteRate, true);     // byte rate
    view.setUint16(32, 2, true);           // block align
    view.setUint16(34, 16, true);          // bits per sample

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(44 + i * 2, s * 0x7FFF, true);
    }

    // Convert ArrayBuffer → base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

function generateTone(freqs: number[], durationMs: number, sampleRate = 8000): number[] {
    const numSamples = Math.floor(sampleRate * durationMs / 1000);
    const samples: number[] = [];
    for (let i = 0; i < numSamples; i++) {
        let val = 0;
        for (const freq of freqs) {
            val += Math.sin(2 * Math.PI * freq * i / sampleRate);
        }
        samples.push((val / freqs.length) * 0.5); // keep volume moderate
    }
    return samples;
}

function generateSilence(durationMs: number, sampleRate = 8000): number[] {
    return new Array(Math.floor(sampleRate * durationMs / 1000)).fill(0);
}

// ── Build Tones ─────────────────────────────────────────────────────

/** Ringback: 440Hz + 480Hz for 2s, silence 4s — standard North American ringback */
function buildRingbackWAV(): string {
    const sr = 8000;
    const samples = [
        ...generateTone([440, 480], 2000, sr),
        ...generateSilence(4000, sr),
    ];
    return encodeWAV(samples, sr);
}

/** Ringtone: friendly F-Major chord pattern — 800ms chord, 1000ms silence */
function buildRingtoneWAV(): string {
    const sr = 8000;
    let samples: number[] = [];
    for (let i = 0; i < 2; i++) {
        samples = samples.concat(
            generateTone([349.23, 440.0, 523.25], 800, sr), // F Major chord (softer)
            generateSilence(1000, sr),
        );
    }
    return encodeWAV(samples, sr);
}

// ── Ring Service ─────────────────────────────────────────────────────

class RingService {
    private ringbackSound: Audio.Sound | null = null;
    private ringtoneSound: Audio.Sound | null = null;
    private vibrationInterval: ReturnType<typeof setInterval> | null = null;
    private isStartingRingtone = false;

    private ringbackBase64: string | null = null;

    /** Pre-generate ringback tone data (call once at init) */
    init() {
        this.ringbackBase64 = buildRingbackWAV();
    }

    // ── Ringback (outgoing call ringing on other side) ──────────────

    async startRingback() {
        try {
            await this.stopRingback();

            if (!this.ringbackBase64) this.init();

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });

            const { sound } = await Audio.Sound.createAsync(
                { uri: `data:audio/wav;base64,${this.ringbackBase64}` },
                { isLooping: true, volume: 0.7 }
            );
            this.ringbackSound = sound;
            await sound.playAsync();
            console.log('🔔 Ringback tone started');
        } catch (err) {
            console.error('Failed to start ringback:', err);
        }
    }

    async stopRingback() {
        const sound = this.ringbackSound;
        this.ringbackSound = null;
        if (sound) {
            try {
                console.log('🔕 Unloading ringback tone...');
                await sound.stopAsync();
                await sound.unloadAsync();
                console.log('🔕 Ringback tone stopped');
            } catch (err) {
                console.error('Failed to stop ringback:', err);
            }
        }
    }

    // ── Ringtone (incoming call) ────────────────────────────────────

    async startRingtone() {
        if (this.isStartingRingtone) return;
        this.isStartingRingtone = true;

        try {
            await this.stopRingtone();

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });

            console.log('📱 Creating ringtone sound from asset...');
            // Use the real incoming_call.aac asset file
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/incoming call.aac'),
                { isLooping: true, volume: 1.0 }
            );
            this.ringtoneSound = sound;
            await sound.playAsync();

            // Vibrate on both platforms
            this.vibrationInterval = setInterval(() => Vibration.vibrate([0, 500, 500]), 2000);

            console.log('📱 Ringtone started (incoming call.aac)');
        } catch (err) {
            console.error('Failed to start ringtone:', err);
        } finally {
            this.isStartingRingtone = false;
        }
    }

    async stopRingtone() {
        const sound = this.ringtoneSound;
        this.ringtoneSound = null;
        if (sound) {
            try {
                console.log('📱 Unloading ringtone...');
                await sound.stopAsync();
                await sound.unloadAsync();
                console.log('📱 Ringtone stopped');
            } catch (err) {
                console.error('Failed to stop ringtone:', err);
            }
        }
        Vibration.cancel();
        if (this.vibrationInterval) {
            clearInterval(this.vibrationInterval);
            this.vibrationInterval = null;
        }
    }

    // ── Cleanup ─────────────────────────────────────────────────────

    async cleanup() {
        await this.stopRingback();
        await this.stopRingtone();
    }
}

export const ringService = new RingService();
