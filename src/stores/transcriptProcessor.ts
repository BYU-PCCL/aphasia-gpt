import { contextStore } from "./contextStore";
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
    transformations: { texts: [], version: 0 },
  });

  

  let abortController = new AbortController();
  
  const updateTransformations = async () => {
    const processor = get(transcriptProcessor);
    const transcript = processor.transcript;
    const processingVersion = transcript.version;
    console.log(`updateTransforms gets called. Processing transcript: 
      "${transcript.text}", with version number: ${processingVersion}`);

    const words = transcript.text;
    const minCleanWordCount = 1;
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
        body: JSON.stringify({
          utterance: recentTranscript,
          setting: get(contextStore).settingContext.selection,
          conversationType: get(contextStore).typeContext.selection,
          tone: get(contextStore).toneContext.selection,
        }),
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
  };
 
 
  return {
    subscribe,
    addTranscriptChunk: (text: string) => {
      console.log(`addTranscriptChunk gets called with input text: "${text}"`);
      // if we're not recording, don't update the transcript
      const processor = get(transcriptProcessor);
      if (!processor.isRecording || text === " ") {
        return;
      }
      updateTransformations();
      abortController.abort();
      update((transcriptProcessor) => {
        const texts = text.split(" ");
        for(let i = 0; i < texts.length; i ++){
          if(texts[i]!== ""){
            transcriptProcessor.transcript.text.push(texts[i]);
          }
        }
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
      //updateTransformations.clear();
      abortController.abort();
      update((transcriptProcessor) => {
        transcriptProcessor.transcript.text = [];
        transcriptProcessor.transformations.texts = [];
        transcriptProcessor.transcript.version += 1;

        // transcriptProcessor.transcript = { text: [], version: 0 };
        // transcriptProcessor.transformations = { texts: [], version: 0 };
        return transcriptProcessor;
      });
    },
    back: () => {
      //updateTransformations.clear();
      abortController.abort();
      update((transcriptProcessor) => {
        transcriptProcessor.transcript.text.pop();
        transcriptProcessor.transcript.version += 1;
        return transcriptProcessor;
      });
      updateTransformations();
    },
    delete: (wordIndex:number) => {
      //updateTransformations().clear;
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
