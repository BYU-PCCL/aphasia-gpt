import { contextStore } from "./contextStore";
import { ProfileStore } from "./EditProfileStore";
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
      update((transcriptProcessor) => {
        transcriptProcessor.transformations.texts = [];
        return transcriptProcessor;
      });
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
          name: get(ProfileStore).Profile.name,
          age:get(ProfileStore).Profile.age,
          about:get(ProfileStore).Profile.about,
          utterance: recentTranscript,
          setting: get(contextStore).settingContext.selection,
          conversationType: get(contextStore).typeContext.selection,
          tone: get(contextStore).toneContext.selection,
          voice: get(contextStore).voiceContext.selectedVoice.name
        }),
        signal: abortSignal
      });
      const data = await response.json();
      const gptTransformations = data.texts;
      console.log("constantGPT transform:", data.txt);
      update((transcriptProcessor) => {
        transcriptProcessor.transformations.texts = gptTransformations;
        transcriptProcessor.transformations.version = processingVersion;
        return transcriptProcessor;
      });
    } catch (error) {
      if (error instanceof DOMException && error.name == 'AbortError') {
        console.log(`Aborted: processing transcript version ${processingVersion}`);
      } else {
        throw error;
      }
    }
  };
  
  const transcriptProcessor = {
    subscribe,
    addTranscriptChunk: (text: string) => {
      console.log(`addTranscriptChunk gets called with input text: "${text}"`);
      // if we're not recording, don't update the transcript
      const processor = get(transcriptProcessor);
      if (!processor.isRecording || text === " ") {
        return;
      }
      
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
    clear: () => {
      abortController.abort();
      update((transcriptProcessor) => {
        transcriptProcessor.transcript.text = [];
        transcriptProcessor.transformations.texts = [];
        transcriptProcessor.transcript.version += 1;
        return transcriptProcessor;
      });
    },
    back: () => {
      abortController.abort();
      update((transcriptProcessor) => {
        transcriptProcessor.transcript.text.pop();
        transcriptProcessor.transcript.version += 1;
        updateTransformations();
        return transcriptProcessor;
      });
      
    },
    delete: (wordIndex:number) => {
      abortController.abort();
      update((transcriptProcessor) => {
        transcriptProcessor.transcript.text.splice(wordIndex, 1);
        transcriptProcessor.transcript.version += 1;
        updateTransformations();
        return transcriptProcessor;
      });
      
    },
  };
  
  
  contextStore.subscribe(() => {
    updateTransformations();
  });
  
  return transcriptProcessor;
}

export const transcriptProcessor = createTranscriptProcessor();
