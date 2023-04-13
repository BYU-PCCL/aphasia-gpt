import throttle from "lodash/throttle";
import { get, writable } from "svelte/store";

type TranscriptProcessor = {
  transcript: string;
  transformations: string[];
};

function createTranscriptProcessor() {
  const { subscribe, set, update } = writable<TranscriptProcessor>({
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
    // stop: () => {
    //   const maxTrascriptTimestamp = getMaximumTranscriptTimestamp();
    //   timestampsToIgnore.add(maxTrascriptTimestamp);
    // },
    clear: () => {
      set({
        transcript: "",
        transformations: [],
      });
    },
    back: () => {
      console.log("back");
      update((transcriptProcessor) => {
        const words = transcriptProcessor.transcript.split(" ");
        const backedTranscript = words.slice(0, -1).join(" ");
        transcriptProcessor.transcript = backedTranscript;
        return transcriptProcessor;
      });
      updateTransfromations();
    },
  };
}

export const transcriptProcessor = createTranscriptProcessor();
