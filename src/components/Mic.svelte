<script lang="ts">
  /*
  Assumption: we don't get a partial transcription for a new time chunk until we get a finalized transcription for the current time chunk. Reading the docs and some example code I *think* this is justifiable.
  Now chunks are demarcated by the audio_start field, so I'm guessing it's as simple as keeping track of what we've already sent and clear that after we send a finalized transcription. If that's a problem, create a map with a key for each audio_start and a value for the text. Then when we get a finalized transcription, just delete the key.
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
  // if assembly ai doesn't care to leave the connection open then just leave it ig.
  async function stopRecording() {
    // get a new token for the next recording
    tokenPromise = getToken();

    // close the socket
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ terminate_session: true }));
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

    console.log("starting recording", token);

    // open the socket
    socket = new WebSocket(
      `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
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
    console.log("socket closed", event);
    stopRecording();
  }

  function onSocketMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    console.log("socket message::", data);

    const transcriptMessageType = ["PartialTranscript", "FinalTranscript"];
    const isTranscript = transcriptMessageType.includes(data.message_type);

    if (!isTranscript) {
      return;
    }

    // TODO: Might need to split and join for word level rather than character level
    const transcriptToSend = data.text.slice(nonfinalTranscript.length);
    nonfinalTranscript = data.message_type === "FinalTranscript" ? "" : data.text;
    onChange(transcriptToSend);
  }

  function onSocketOpen(event: Event) {
    console.log("socket opened", event);
    initializeRecorder();
  }

  async function initializeRecorder() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new RecordRTCPromisesHandler(stream, {
      type: "audio",
      mimeType: "audio/webm;codecs=pcm",
      recorderType: StereoAudioRecorder,
      timeSlice: 250,
      desiredSampRate: 16000,
      numberOfAudioChannels: 1,
      bufferSize: 4096,
      audioBitsPerSecond: 128000,
      ondataavailable: onRecorderDataAvailable,
    });

    recorder.startRecording();
  }

  function onRecorderDataAvailable(blob: Blob) {
    console.log("recorder data available", blob);

    const reader = new FileReader();
    reader.onload = () => {
      const base64data = reader.result as string;

      // audio data must be sent as a base64 encoded string
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ audio_data: base64data.split("base64,")[1] }));
      }
    };
    reader.readAsDataURL(blob);
  }
</script>
