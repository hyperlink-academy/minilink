import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages } from 'ai';
import { useEffect, useState } from 'react';
import { useReplicache } from 'src/replicache';
import { Attributes } from 'src/replicache/attributes';
import { scanIndex } from 'src/replicache/utils';

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

            Here is an example component that gets the number of undone tasks in a checklist:
            ${exampleComponent}

            The "scanIndex" function takes a transaction and returns an object of indexes.
            The "eav" method is used to get facts given an entity and an attribute.
            the "vae" method is used to get the facts that *references* a given entity, and an attribute.

            The available attributes are: 
            ${JSON.stringify(Attributes, null, 2)}

            The returned facts are an object with a data property which contains their data.
            The "Data" type is defined as follows:
            ${AttributeValueType}

            Use the <RenderedTextBlock> component to render text. It takes an entityID and renders the text of the block, looking up the "block/text" attribute.

            Use the elementId function to get the IDs of elements, blocks and cards, in the document. It takes an entityID and returns an object with the IDs of the text and container elements.
            ${elementID}
            `.replace("\n", " "),
          },
          {role: "user", content: prompt}
    ],
  });

  return result.toDataStreamResponse();
}

let startFence ="```js"
let endFence = "```"
const exampleComponent = `
${startFence}
  let { rep } = useReplicache();
  let [undoneBlocks, setUndoneBlocks] = useState(0);
  useEffect(() => {
    if (!rep) return;
    let unsubscribe = rep?.subscribe(
      async (tx) => {
        let undone = 0;
        const getCheckedChildren = async (root) => {
          let children = await scanIndex(tx).eav(root, "card/block");
          for (let block of children) {
            let [checklist] = await scanIndex(tx).eav(
              block.data.value,
              "block/check-list"
            );
            if (checklist && !checklist.data.value) undone++;
            await getCheckedChildren(block.data.value);
          }
        };
        await getCheckedChildren(props.parent)
        return undone;
      },
      (data) => setUndoneBlocks(data)
    );
    return () => unsubscribe();
  }, [props.parent, rep]);

  return <div>tasks left: {undoneBlocks}</div>;
${endFence}
`
const AttributeValueType = `
export type Data<A extends keyof typeof Attributes> = {
  text: { type: "text"; value: string };
  string: { type: "string"; value: string };
  "ordered-reference": {
    type: "ordered-reference";
    position: string;
    value: string;
  };
  image: {
    type: "image";
    fallback: string;
    src: string;
    height: number;
    width: number;
    local?: string;
  };
  boolean: {
    type: "boolean";
    value: boolean;
  };
  number: {
    type: "number";
    value: number;
  };
  awareness: {
    type: "awareness";
    value: string;
  };
  reference: { type: "reference"; value: string };
  "block-type-union": {
    type: "block-type-union";
    value: "text" | "image" | "card" | "heading" | "link" | "mailbox" | "code";
  };
  color: { type: "color"; value: string };
}[(typeof Attributes)[A]["type"]];
`

const elementID = `
export const elementId = {
  block: (id: string) => ({
    text: \`block/\${id}/content\`,
    container: \`block/\${id}/container\`,
  }),
  card: (id: string) => ({
    container: \`card/\${id}/container\`,
  }),
`;
