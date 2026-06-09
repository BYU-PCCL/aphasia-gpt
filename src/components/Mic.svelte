<script lang="ts">
  /*
  AssemblyAI Universal-Streaming (v3) API.

  Each "Turn" message carries the full running `transcript` for the current
  turn. While the turn is in progress messages arrive with `end_of_turn: false`
  and a growing transcript; the turn's final message has `end_of_turn: true`.
  We track how much of the running transcript we've already forwarded
  (`nonfinalTranscript`) and only send the delta, then clear it when the turn
  ends so the next turn starts fresh.

  Audio is sent as raw 16-bit PCM binary frames (not base64 JSON as in v2).
  */

  import { RecordRTCPromisesHandler, StereoAudioRecorder } from "recordrtc";
  import { onDestroy } from "svelte";

  export let isRecording: boolean;
  export let onChange: (text: string) => void;
  export let onFail: (message: string) => void;

  let stream: MediaStream | null = null;
  let recorder: RecordRTCPromisesHandler | null = null;
  let socket: WebSocket | null = null;
  let nonfinalTranscript = "";

  let tokenPromise = getToken();

  $: isRecording ? startRecording() : stopRecording();
  onDestroy(stopRecording);

  // TODO: decide if we want to close everything or just pause the recorder
  // if assembly ai doesn't care to leave the connection open then just leave it I guess
  async function stopRecording() {
    // get a new token for the next recording
    tokenPromise = getToken();

    // close the socket
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "Terminate" }));
      socket.close();
      socket = null;
    }

    // close the recorder
    if (recorder) {
      await recorder.pauseRecording();
      await recorder.destroy();
      recorder = null;
    }

    // close the stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    if (isRecording) {
      onFail("recording stopped unexpectedly");
    }
  }

  async function getToken() {
    // get temporary api key
    const response = await fetch("/api/assemblyai-token");
    const { token } = await response.json();
    return token;
  }

  async function startRecording() {
    const token = await tokenPromise;

    // console.log("starting recording", token);

    // open the socket
    socket = new WebSocket(
      `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&encoding=pcm_s16le&token=${token}`
    );

    // socket event
    socket.onopen = onSocketOpen;
    socket.onmessage = onSocketMessage;
    socket.onclose = onSocketClose;
    socket.onerror = onSocketError;
  }

  function onSocketError(event: Event) {
    console.error("socket error", event);
    stopRecording();
  }

  function onSocketClose(event: CloseEvent) {
    // console.log("socket closed", event);
    // console.log("socket closed with code:", event.code);

    stopRecording();
  }

  function onSocketMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    // console.log("socket message::", data);

    // v3 sends "Begin", "Turn", and "Termination" messages. Only "Turn"
    // messages carry transcribed text (in the `transcript` field).
    if (data.type !== "Turn") {
      return;
    }

    const text = data.transcript ?? "";

    // TODO: Might need to split and join for word level rather than character level
    let transcriptToSend = text.slice(nonfinalTranscript.length);
    transcriptToSend = transcriptToSend.replace(".", " ");
    transcriptToSend = transcriptToSend.replace(/\s+/g, " ");
    nonfinalTranscript = data.end_of_turn ? "" : text;
    if (transcriptToSend && transcriptToSend.length > 0) {
      onChange(transcriptToSend);
    }
  }

  function onSocketOpen(event: Event) {
    // console.log("socket opened", event);
    initializeRecorder();
  }

  async function initializeRecorder() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new RecordRTCPromisesHandler(stream, {
      type: "audio",
      mimeType: "audio/webm;codecs=pcm",
      recorderType: StereoAudioRecorder,
      timeSlice: 250, //changed from 250 to 600 to see if it affects chunking
      desiredSampRate: 16000,
      numberOfAudioChannels: 1,
      bufferSize: 4096,
      audioBitsPerSecond: 128000,
      ondataavailable: onRecorderDataAvailable,
    });

    recorder.startRecording();
  }

  function onRecorderDataAvailable(blob: Blob) {
    // console.log("recorder data available", blob);

    // v3 expects raw 16-bit PCM audio sent as binary websocket frames.
    // The recorder is configured to produce mono 16 kHz PCM, so we forward the
    // chunk's bytes directly.
    if (socket && socket.readyState === WebSocket.OPEN) {
      blob.arrayBuffer().then((buffer) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(buffer);
        }
      });
    }
  }
</script>
