import {genkit} from 'genkit';
import {ollama} from 'genkitx-ollama';
import {config} from 'dotenv';

config();

export const ai = genkit({
  plugins: [
    ollama({
      models: [
        {
          name: 'gemma', // Replace with your desired Ollama model
          type: 'generate',
        },
      ],
      serverAddress: 'http://127.0.0.1:11434', // Default Ollama address
    }),
  ],
  model: 'ollama/gemma', // Set the default model to use
});
