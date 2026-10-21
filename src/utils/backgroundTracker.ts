/**
 * Background execution and Screen WakeLock manager
 * Enables continuous GPS tracking and LoRa mesh pinging even when the phone is locked or in pocket.
 */

let wakeLockSentinel: any = null;
let audioContext: AudioContext | null = null;
let silentOscillator: OscillatorNode | null = null;
let isKeepAliveActive = false;

/**
 * Requests Screen WakeLock to prevent the device from sleeping
 */
export async function requestScreenWakeLock(onStatusChange?: (locked: boolean) => void): Promise<boolean> {
  const nav = navigator as any;
  if (typeof navigator !== 'undefined' && nav.wakeLock) {
    try {
      wakeLockSentinel = await nav.wakeLock.request('screen');
      onStatusChange?.(true);

      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
        onStatusChange?.(false);
      });

      // Handle visibility change to automatically re-request lock if user unlocks phone
      const handleVisibilityChange = async () => {
        if (wakeLockSentinel === null && document.visibilityState === 'visible') {
          try {
            wakeLockSentinel = await nav.wakeLock.request('screen');
            onStatusChange?.(true);
          } catch (e) {
            // ignore
          }
        }
      };

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return true;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
    }
  }
  return false;
}

/**
 * Releases Screen WakeLock
 */
export async function releaseScreenWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch (e) {
      // ignore
    }
    wakeLockSentinel = null;
  }
}

/**
 * Starts silent Web Audio keep-alive buffer.
 * Browsers (especially iOS Safari and Android Chrome) allow continuous GPS & JS background execution
 * if an active audio session is playing.
 */
export function startSilentAudioKeepalive(): boolean {
  if (isKeepAliveActive) return true;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return false;

    audioContext = new AudioCtx();

    // Create a 1-second silent buffer
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Gain node set to zero volume (completely silent)
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.001; // barely non-zero so browser treats as active audio

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start();
    isKeepAliveActive = true;
    return true;
  } catch (err) {
    console.warn('Silent audio keepalive failed:', err);
    return false;
  }
}

/**
 * Stops silent audio keep-alive
 */
export function stopSilentAudioKeepalive(): void {
  if (audioContext) {
    try {
      audioContext.close();
    } catch (e) {
      // ignore
    }
    audioContext = null;
    isKeepAliveActive = false;
  }
}
