# Multiple-LLM-Chatbot
This project is a voice-activated chat interface built with React, TypeScript, and Next.js, enabling seamless interaction with multiple language models (GPT-3, GPT-4, LLaMA). The app listens for user speech, processes it, and communicates with the backend to generate audio responses from the selected AI model.

## Key Features

- **Real-time Speech Recognition**: Uses the browser's `webkitSpeechRecognition` to capture and process user speech.
- **Dynamic Model Selection**: Automatically selects the appropriate model (GPT-3, GPT-4, LLaMA) based on detected keywords in the speech.
- **Responsive Audio Feedback**: The app generates concise, spoken responses using different voices depending on the selected model.
- **Interactive UI**: Users can start and stop recording with a single button, and the interface provides visual feedback during recording and playback.

## Backend Integration

- **Language Models**: Supports multiple models (GPT-3, GPT-4, LLaMA) using OpenAI and LangChain integrations.
- **Text-to-Speech**: Converts AI-generated text into audio using OpenAI's speech synthesis models.
- **Flexible API**: Handles POST requests to process speech inputs and return audio responses.

## Requirements
Local LLaMA Instance: This project currently requires a local LLaMA instance running on http://localhost:11434 to function properly. If you do not have a local LLaMA setup, you will need to remove or modify the LLaMA integration in the code. The project will still function using GPT-3 and GPT-4 models via the OpenAI API.
