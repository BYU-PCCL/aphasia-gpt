import throttle from "lodash/throttle";
import { get, writable } from "svelte/store";

type TranscriptProcessor = {
  isRecording: boolean;
  transcript: { text: string[]; version: number;};
  transformations: { texts: string[]; version: number };
};

function createTranscriptProcessor() {
  const { subscribe, set, update } = writable<TranscriptProcessor>({
    isRecording: false,
    transcript: { text: [], version: 0} ,
    transformations: { texts: [], version: 0 }
  });

  

  let abortController = new AbortController();
  
  const updateTransformations = throttle(async () => {
    const processor = get(transcriptProcessor);
    const transcript = processor.transcript;
    const processingVersion = transcript.version;
    console.log(`updateTransforms gets called. Processing transcript: 
      "${transcript.text}", with version number: ${processingVersion}`);

    const words = transcript.text;
    const minCleanWordCount = 2;
    const maxCleanWordCount = 20;
    if (words.length < minCleanWordCount) {
      return;
    }
    const recentTranscript = words.slice(-maxCleanWordCount).join(" ");

    abortController = new AbortController();
    const abortSignal = abortController.signal;

    
    try {
      const response = await fetch("/api/gpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ utterance: recentTranscript }),
        signal: abortSignal
      });
      const data = await response.json();
      const gptTransformations = data.texts;
      update((transcriptProcessor) => {
        transcriptProcessor.transformations.texts = gptTransformations;
        transcriptProcessor.transformations.version = processingVersion;
        return transcriptProcessor;
      });
    } catch (error) {
      if (error instanceof DOMException && error.name == 'AbortError') {
        console.log(`Aborted: proccessing transcript version ${processingVersion}`);
      } else {
        throw error;
      }
    }
  }, 250);
  //250 change it to see the time delay
  //looking at throttle
  //max work account
  //post on vercel
  //fix hover box
  //fix delete function

  return {
    subscribe,
    addTranscriptChunk: (text: string) => {
      console.log(`addTranscriptChunk gets called with input text: "${text}"`);
      // if we're not recording, don't update the transcript
      const processor = get(transcriptProcessor);
      if (!processor.isRecording || text === " ") {
        return;
      }
      updateTransformations.cancel();
      abortController.abort();
      update((transcriptProcessor) => {
        transcriptProcessor.transcript.text.push(text);
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
      abortController.abort();
      update((transcriptProcessor) => {
        transcriptProcessor.transcript = { text: [], version: 0 };
        transcriptProcessor.transformations = { texts: [], version: 0 };
        return transcriptProcessor;
      });
    },
    back: () => {
      updateTransformations.cancel();
      abortController.abort();
      update((transcriptProcessor) => {
        transcriptProcessor.transcript.text.pop();
        transcriptProcessor.transcript.version += 1;
        return transcriptProcessor;
      });
      updateTransformations();
    },
    delete: (wordIndex) => {
      updateTransformations.cancel();
      abortController.abort();
      update((transcriptProcessor) => {
        transcriptProcessor.transcript.text.splice(wordIndex, 1);
        transcriptProcessor.transcript.version += 1;
        return transcriptProcessor;
      });
      
      updateTransformations();
    },
  };
}

export const transcriptProcessor = createTranscriptProcessor();
