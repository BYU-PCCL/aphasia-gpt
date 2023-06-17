Flow of the main functionality:

## Click the middle mic button (to start):

- On the page `+page.svelte`, the `Controls` panel defines the functionalities of the three buttons related to audio recording.

- In the `Controls` panel, which is defined by `Controls.svelte`, the middle button is always shown. The state of the middle button is determined by the variable `isRecording`. In the beginning, `isRecording = false`, so only the middle button is shown.

- Clicking the middle button will trigger `toggleRecording`, which is defined by `transcriptProcessor.toggleRecording`. It will change `transcriptProcessor.isRecording` from `false` to `true`.

- In the `Controls` panel, the variable `isRecording` will then be updated to be the same as `transcriptProcessor.isRecording`. So now `isRecording = true`.

- In the Mic component `Mic.svelte`, when `isRecording = true`, the function `startRecording` gets called.

- The function `startRecording` will get a token to access assemblyAI, open a web socket to communicate with assemblyAI, and define the event handlers on this websocket.

## Start speaking

- If the user starts speaking, the event handler `.onmessage` of the web socket will be triggered, which is defined by the function `onSocketMessage`.

- When the function `onSocketMessage` gets called, it sends the transcript, which is obtained from `evet.data.text`, to the function `onChange`.

- The function `onChange` in the Mic component `Mic.svelte` is defined in the page component `+page.svelte`, by the function `transcriptProcessor.addTranscriptChunk`.

- So the transcript text is sent to the function `transcriptProcessor.addTranscriptChunk`. This function `addTranscriptChunk` will:
  -- append the new `text` to the existing transcript, and update `transcriptProcessor.transcript`. Then the content on the page `+page.svelte` right below "What we think you said:" will be updated accordingly.
  -- call the function `updateTransformations`, which will send the transcript to chatGPT and get back predictions stored in `transcriptProcessor.transformations`. Then the content on the page `+page.svelte` right below "What we think you are trying to say:" will be updated accordingly.

### Take a closer look at updateTransformations

- Uses `throttle(func, wait, options)` to throttle the function `func` so that it only gets called at most once per every `wait` milliseconds. The reason is, `onChange` will be triggered frequently, and we don't want to call the function frequently

-

## Click the middle mic button (to stop):
