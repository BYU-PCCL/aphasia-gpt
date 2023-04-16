import throttle from "lodash/throttle";
import { get, writable } from "svelte/store";

type TranscriptProcessor = {
  isRecording: boolean;
  transcript: string;
  transformations: string[];
};

function createTranscriptProcessor() {
  const { subscribe, set, update } = writable<TranscriptProcessor>({
    isRecording: false,
    transcript: "",
    transformations: [],
  });

  const updateTransfromations = throttle(async () => {
    const transcript = get(transcriptProcessor).transcript;
    const words = transcript.split(" ");
    const minCleanWordCount = 2;
    const maxCleanWordCount = 10;
    console.log(`transcript "${transcript}" words ${words.length}`);
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
      transcriptProcessor.transformations = gptTransformations;
      return transcriptProcessor;
    });
  }, 250);

  return {
    subscribe,
    addTranscriptChunk: (text: string) => {
      // if we're not recording, don't update the transcript
      const processor = get(transcriptProcessor);
      if (!processor.isRecording) {
        return;
      }

      update((transcriptProcessor) => {
        let nextTranscript = transcriptProcessor.transcript + text;
        // Fix the excessive periods
        nextTranscript = nextTranscript.replace(".", " ");
        nextTranscript = nextTranscript.replace(/\s+/g, " ");
        transcriptProcessor.transcript = nextTranscript;
        return transcriptProcessor;
      });
      updateTransfromations();
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
      updateTransfromations.cancel();
      update((transcriptProcessor) => {
        transcriptProcessor.transcript = "";
        transcriptProcessor.transformations = [];
        return transcriptProcessor;
      });
    },
    back: () => {
      update((transcriptProcessor) => {
        let nextTranscript = transcriptProcessor.transcript;
        const endsWithSpace = nextTranscript.endsWith(" ");
        if (endsWithSpace) {
          nextTranscript = nextTranscript.slice(0, -1);
        }
        nextTranscript = nextTranscript.split(" ").slice(0, -1).join(" ");
        if (endsWithSpace) {
          nextTranscript += " ";
        }
        transcriptProcessor.transcript = nextTranscript;
        return transcriptProcessor;
      });
      updateTransfromations();
    },
  };
}

export const transcriptProcessor = createTranscriptProcessor();
