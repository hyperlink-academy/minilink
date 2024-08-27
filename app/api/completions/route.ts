import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt } = await req.json() as { prompt: string };

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20240620'),
    messages: [
        {
            role: "system",
            content: `Your entire response should only be JavaScript using React, and the JSX syntax.
            Your response should start with \`\`\`js and end with \`\`\`, so full code fences.
            There should be no comments like "more content here", it should be complete and directly runnable.
            Write the body of a function that returns JSX. You do not need to name the function or write the function() keyword or any other function declaration syntax. Return just the body of the function.
            You do not need to import React.
            You cannot use any other libraries.
            If the prompt includes existing code in a fenced code block, modify that code according to the instructions. Otherwise, generate new code based on the prompt.
            `.replace("\n", " "),
          },
          {role: "user", content: prompt}
    ],
  });

  return result.toDataStreamResponse();
}