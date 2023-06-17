import throttle from "lodash/throttle";
import { get, writable } from "svelte/store";

type TranscriptProcessor = {
  isRecording: boolean;
  transcript: { text: string; version: number; };
  transformations: { texts: string[]; version: number };
};

function createTranscriptProcessor() {
  const { subscribe, set, update } = writable<TranscriptProcessor>({
    isRecording: false,
    transcript: { text: "", version: 0 } ,
    transformations: { texts: [], version: 0 }
  });

  const updateTransformations = throttle(async () => {
    console.log("updateTransforms gets called");
    const processor = get(transcriptProcessor);
    const transcript = processor.transcript;
    const processingVersion = transcript.version;

    console.log(`processing transcript: "${transcript.text}", with version number: ${transcript.version}`);

    const words = transcript.text.split(" ");
    const minCleanWordCount = 2;
    const maxCleanWordCount = 10;
    if (words.length < minCleanWordCount) {
      return;
    }
    const recentTranscript = words.slice(-maxCleanWordCount).join(" ");
    const response = await fetch("/api/gpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ utterance: recentTranscript }),
    });
    const data = await response.json();
    const gptTransformations = data.texts;
    update((transcriptProcessor) => {
      transcriptProcessor.transformations.texts = gptTransformations;
      transcriptProcessor.transformations.version = processingVersion;
      return transcriptProcessor;
    });
  }, 250);

  return {
    subscribe,
    addTranscriptChunk: (text: string) => {
      console.log(`addTranscriptChunk gets called with input text: "${text}"`);
      // if we're not recording, don't update the transcript
      const processor = get(transcriptProcessor);
      if (!processor.isRecording) {
        return;
      }
      updateTransformations.cancel();
      update((transcriptProcessor) => {
        let nextTranscript = transcriptProcessor.transcript.text + text;
        transcriptProcessor.transcript.text = nextTranscript;
        transcriptProcessor.transcript.version += 1;
        return transcriptProcessor;
      });
      updateTransformations();
    },
    stopRecording: () => {
      update((transcriptProcessor) => {
        transcriptProcessor.isRecording = false;
        return transcriptProcessor;
      });
    },
    toggleRecording: () => {
      update((transcriptProcessor) => {
        transcriptProcessor.isRecording = !transcriptProcessor.isRecording;
        return transcriptProcessor;
      });
    },
    // stop: () => {
    //   const maxTrascriptTimestamp = getMaximumTranscriptTimestamp();
    //   timestampsToIgnore.add(maxTrascriptTimestamp);
    // },
    clear: () => {
      updateTransformations.cancel();
      update((transcriptProcessor) => {
        transcriptProcessor.transcript = { text: "", version: 0 };
        transcriptProcessor.transformations = { texts: [], version: 0 };
        return transcriptProcessor;
      });
    },
    back: () => {
      updateTransformations.cancel();
      update((transcriptProcessor) => {
        let nextTranscript = transcriptProcessor.transcript.text;
        const endsWithSpace = nextTranscript.endsWith(" ");
        if (endsWithSpace) {
          nextTranscript = nextTranscript.slice(0, -1);
        }
        nextTranscript = nextTranscript.split(" ").slice(0, -1).join(" ");
        if (endsWithSpace) {
          nextTranscript += " ";
        }
        transcriptProcessor.transcript.text = nextTranscript;
        transcriptProcessor.transcript.version += 1;
        return transcriptProcessor;
      });
      updateTransformations();
    },
  };
}

export const transcriptProcessor = createTranscriptProcessor();
