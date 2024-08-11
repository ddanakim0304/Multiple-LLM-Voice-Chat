import OpenAI from "openai";
import dotenv from "dotenv";
import { OpenAI as LangchainOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/community/llms/ollama";

dotenv.config();

// setup OpenAI instance
const openai = new OpenAI();

async function createAudio(fullMessage: string, voice: "echo" | "nova" | "fable") {
    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: fullMessage,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer.toString("base64");
}

// HTTP POST handler
export async function POST(req: Request): Promise<Response> {
    const body = await req.json();
    let message = body.message.toLowerCase();
    let modelName = body.model || "gpt4";

    // function to remove the first word of a string (used to remove model name)
    const removeFirstWord = (text: string) => text.includes(" ") ? text.substring(text.indexOf(" ") + 1) : "";
    message = removeFirstWord(message);

    // initialize variable for message and audio
    let introMessage = "", base64Audio, voice: "echo" | "nova" | "fable" = "echo", gptMessage, fullMessage;

    // common prompt for all models
    const commonPrompt = "Be precise and concise, never respond in more than 1-2 sentences!" + message;

    // handle different model cases
    if (modelName == "gpt4") {
        const llm = new LangchainOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        gptMessage = await llm.invoke(commonPrompt);
        introMessage = "GPT 4o mini here, ";
        voice = "echo"
    } else if (modelName === "gpt3") {
        const llm = new LangchainOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        gptMessage = await llm.invoke(commonPrompt);
        introMessage = "GPT3 point 5 here, ";
        voice = "nova";
    } else if (modelName === "llama") {
        const llm = new Ollama({
            baseUrl: "http://localhost:11434",
            model: "llama3",
        });
        gptMessage = await llm.invoke(commonPrompt);
        introMessage = "llama 3 here, ";
        voice = "fable";
    }

    // compile the full message
    fullMessage = introMessage + gptMessage;
    base64Audio = await createAudio(fullMessage, voice);

    // Return a proper Response object
    return new Response(JSON.stringify({ data: base64Audio, contentType: 'audio/mp3', model: modelName }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
