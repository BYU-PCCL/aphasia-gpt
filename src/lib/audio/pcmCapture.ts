/**
 * Captures microphone audio as 16-bit little-endian PCM frames, which is the
 * format AssemblyAI's streaming API expects.
 *
 * Uses an AudioWorklet (off the main thread) when available and falls back to
 * a ScriptProcessorNode otherwise. Frames are delivered roughly every 100 ms.
 *
 * Browser-only: do not import from server code.
 */

export interface PcmCaptureOptions {
  /** Preferred sample rate. The browser may not honor it; check `sampleRate`. */
  sampleRate?: number;
  /** Target frame length in ms. AssemblyAI accepts 50–1000 ms chunks. */
  frameMs?: number;
  onFrame: (pcm: ArrayBuffer) => void;
}

// The worklet source is inlined and loaded via a Blob URL so no extra static
// asset needs to be deployed.
const WORKLET_SOURCE = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.frameSize = (options.processorOptions && options.processorOptions.frameSize) || 1600;
    this.buffer = new Int16Array(this.frameSize);
    this.offset = 0;
  }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;
    for (let i = 0; i < channel.length; i++) {
      const s = Math.max(-1, Math.min(1, channel[i]));
      this.buffer[this.offset++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this.offset === this.frameSize) {
        this.port.postMessage(this.buffer.buffer, [this.buffer.buffer]);
        this.buffer = new Int16Array(this.frameSize);
        this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor("pcm-capture", PcmCaptureProcessor);
`;

export class PcmCapture {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: AudioWorkletNode | ScriptProcessorNode | null = null;
  private silentSink: GainNode | null = null;
  private muted = false;

  /** The sample rate actually in use. Valid after `start()` resolves. */
  sampleRate = 16000;

  async start(options: PcmCaptureOptions): Promise<void> {
    const preferredRate = options.sampleRate ?? 16000;
    const frameMs = options.frameMs ?? 100;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    try {
      this.context = new AudioContext({ sampleRate: preferredRate });
    } catch {
      // Some browsers refuse a custom sample rate; fall back to the default and
      // tell AssemblyAI the real rate via `sampleRate`.
      this.context = new AudioContext();
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    this.sampleRate = this.context.sampleRate;

    const frameSize = Math.round((this.sampleRate * frameMs) / 1000);
    this.source = this.context.createMediaStreamSource(this.stream);

    // A muted gain node keeps the graph "connected" (required for processing in
    // some browsers) without feeding the microphone back to the speakers.
    this.silentSink = this.context.createGain();
    this.silentSink.gain.value = 0;
    this.silentSink.connect(this.context.destination);

    const deliver = (buffer: ArrayBuffer) => {
      if (!this.muted) options.onFrame(buffer);
    };

    if (this.context.audioWorklet) {
      const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "text/javascript" }));
      try {
        await this.context.audioWorklet.addModule(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      const worklet = new AudioWorkletNode(this.context, "pcm-capture", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
        processorOptions: { frameSize },
      });
      worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => deliver(event.data);
      this.source.connect(worklet);
      worklet.connect(this.silentSink);
      this.node = worklet;
    } else {
      // Legacy fallback. Buffer size must be a power of two.
      const bufferSize = 4096;
      const processor = this.context.createScriptProcessor(bufferSize, 1, 1);
      let pending = new Int16Array(frameSize);
      let offset = 0;
      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          pending[offset++] = s < 0 ? s * 0x8000 : s * 0x7fff;
          if (offset === frameSize) {
            deliver(pending.buffer);
            pending = new Int16Array(frameSize);
            offset = 0;
          }
        }
      };
      this.source.connect(processor);
      processor.connect(this.silentSink);
      this.node = processor;
    }
  }

  /**
   * Temporarily stop delivering frames (e.g. while the device is speaking so
   * its own voice is not transcribed as the partner's).
   */
  setMuted(muted: boolean) {
    this.muted = muted;
  }

  async stop(): Promise<void> {
    this.node?.disconnect();
    this.source?.disconnect();
    this.silentSink?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    if (this.context && this.context.state !== "closed") {
      await this.context.close().catch(() => undefined);
    }
    this.node = null;
    this.source = null;
    this.silentSink = null;
    this.stream = null;
    this.context = null;
  }
}
