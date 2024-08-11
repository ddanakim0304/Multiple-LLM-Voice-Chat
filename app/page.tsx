"use client";
import { useEffect, useState, useRef } from "react";

declare global {
  interface Window {
    //  used in web browsers to handle speech recognition
    webkitSpeechRecognition: any;
  }
}

// main function
export default function Home() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] =  useState<boolean>(false);

  // hooks for speech recognition and silence detection
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // determine CSS class for model display based on state
  const getModelClassName = (model: string): string => {
    return (model === model && isPlaying ? " prominent-pulse" : "");
  };

  // handle backend communication
  const sendToBackend = async (message: string, modelKeyword?: string): Promise<void> => {
    console.log(`sendToBackend called with message: ${message}, modelKeyword: ${modelKeyword}`);
    setIsLoading(true);
    if (modelKeyword) setModel(modelKeyword);
    else if (!model) setModel("gpt4");

    try {
      // 1. stop recording before sending data
      stopRecording();

      // 2. send POST request to backend
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ message, model: modelKeyword}),
      });

      // 3. check for response validity
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      //4. process and play audio response if available
      const data = await response.json();
      console.log("Received data from backend:", data);
      if (data.data && data.contentType === "audio/mp3") {
        // prepares the audio to be played by creating a source that the browser can use to play the audio
        const audioSrc = `data:audio/mp3;base64,${data.data}`;
        // creates a new audio object that can play the audio
        const audio = new Audio(audioSrc);
        // updates the state to indicate that the audio is playing
        setIsPlaying(true);
        audio.play();
        // sets up an action for when the audio finishes playing
        audio.onended = () => {
          // updates the state to show that the audio is no longer playing
          setIsPlaying(false);
          // start recording again
          startRecording();
          //  If the server sent a new model in the response, update the model
          if (data.model) setModel (data.model);
        };
      }
    } catch (error) {
      console.error("Error sending data to the backend or playing audio:", error);
    }
    setIsLoading(false);
  };

  // render individual model section bubbles (UI element)
  const renderModelBubble = (model: string, displayName: string, bgColor: string): JSX.Element => {
    return (
      <div className={`flex flex-col items-center model-bubble text-center${getModelClassName(model)}`}>
        {/* loading UI around bubble */}
        {isLoading && model === model && <div className="loading-indicator"></div>}
        <div className={`w-48 h-48 flex items-center justify-center ${bgColor} text-white rounded-full`}>
          {displayName}
        </div>
      </div>
    );
  };

  // process speech recognition results
  const handleResult = (event: any): void => {
    console.log("Speech recognition result event:", event);
    // stops the silence timer if it's running
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    // creates a string to hold the interim transcript
    let interimTranscript = "";
    // add all the words into the interim transcript
    for (let i = event.resultIndex; i<  event.results.length; ++i) {
      interimTranscript += event.results[i][0].transcript;
    }

    // update the transcript state with the interim transcript
    setTranscript(interimTranscript);

    console.log("Interim transcript:", interimTranscript);

    // end the transcription when there is 3 seconds of silence
    // extract and send detected words to backend
    silenceTimerRef.current = setTimeout(() => {
      // add all words of interim transcript to an array
      const words = interimTranscript.split(" ");
      // setup model keywords
      const modelKeywords = [
        "gpt4",
        "gpt3",
        "llama",
        "lama"
      ];

      // detect the model keyword in the first three words of the interim transcript
      const detectedModel = modelKeywords.find((keyword) => 
        words.slice(0,3).join(" ").toLowerCase().includes(keyword));

        let finalModel = detectedModel;
        if (detectedModel === 'lama' || detectedModel === 'llama') {
          finalModel = 'llama';
        }
        console.log("Detected model:", finalModel);
      
      // update the model state to detected model
      // if detected model is not specified, use the default model (gpt4)
      setModel(detectedModel || "gpt4");

      // send the interim transcript to the backend
      sendToBackend(interimTranscript, detectedModel);
      console.log("transcript:", transcript);

      // clear the interim transcript
      setTranscript("");
    }, 2000);
  };

  // initialized speech recognition
  const startRecording = () => {
  console.log("Starting recording...");
  setIsRecording(true);
  // reset the transcript and response states
  setTranscript("");
  setResponse("");

  // setup new speech recognition object
  recognitionRef.current = new window.webkitSpeechRecognition();
  // keep listening continuously, even if there are pauses in speech
  recognitionRef.current.continuous = true;
  // provide live, real-time feedback on what it thinks is being said, even before it’s certain about the final result
  recognitionRef.current.interimResults = true;
  recognitionRef.current.lang = "en-US";
  // after recognizing the speech, call handleResult function
  recognitionRef.current.onresult = handleResult;
  recognitionRef.current.onend = () => {
    setIsRecording(false);
    console.log("Recording ended.");
    // if there is an active silence timer, stop it
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // starts the speech recognition process again
    recognitionRef.current.start();
  };


  // clean up with useEffect on component unmount (removed from the screen - ex. user navigates to a different page)
  useEffect(() => () => {
    if (recognitionRef.current) recognitionRef.current.stop();}
    , []
  );

  // stop speech recognition
  const stopRecording = () => {
    console.log("Stopping recording...");
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  // toggle recording state
  // toggle = switch between two states
  // start recording if not recording, stop recording if recording
  const handleToggleRecording = () => {
    console.log("Toggling recording. Current state:", { isRecording, isPlaying });
    if (!isRecording && !isPlaying) startRecording();
    else if (isRecording) stopRecording();
  }

  //render main component
  return (
    // Render recording and transcript status
    <main className="flex h-screen flex-col items-center bg-gray-100">
      {(isRecording || transcript || response) && (
        <div className = "absolute top-0 left-1/2 transform -translate-x-1/2 w-full m-auto bg-white p-4">
          <div className = "flex justify-center items-center w-full">
            <div className = "text-center">
              <p className = "text-xl font-bold">{isRecording? "Listening" : ""}</p>
              {transcript && (
                <div className = "p-2 h-full mt-4 text-center">
                  <p className="text-lg mb-0">{transcript}</p>
                </div>
              )}
            </div>
          </div>
          </div>
      )}
      {/* render model section */}
      <div className="flex items-center justify-center w-full h-screen">
        <div className="w-full">
          <div className="grid grid-cols-3 gap-8 mt-10">
            {renderModelBubble("gpt3", "GPT-3.5", "bg-indigo-500")}
            {renderModelBubble("gpt4", "GPT-4", "bg-teal-500")}
            {renderModelBubble("llama"
              , "Llama3 8B", "bg-lime-500")}
            {/* recording button */}
            <div className="flex items-center justify-center w-screen">
              <button
                onClick={handleToggleRecording}
                className={`m-auto flex items-center justify-center ${
                  isRecording ? "bg-red-500 prominent-pulse" : "bg-blue-500"
                } rounded-full w-48 h-48 focus:outline-none`}
              >
                <span className="text-white text-xl font-bold">
                  {isRecording ? "recording.." : "press to record"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}