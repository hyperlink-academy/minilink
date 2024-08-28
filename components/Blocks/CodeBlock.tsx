import { Block, BlockProps, focusBlock, ListMarker } from "components/Blocks";
import "ses";
import { useMemo, useState, createElement, useEffect, useRef } from "react";
import { useSmoker, useToaster } from "components/Toast";
import { transform } from "@babel/standalone";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import { RenderedTextBlock, TextBlock } from "./TextBlock";
import { useEntity, useReplicache } from "src/replicache";
import { useEntitySetContext } from "components/EntitySetProvider";
import { useSubscribe } from "replicache-react";
import { useCompletion } from "ai/react";
import { ButtonPrimary } from "components/Buttons";
import { scanIndex } from "src/replicache/utils";
import { elementId } from "src/utils/elementId";

export function CodeBlock(props: BlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const codeValue = useEntity(props.entityID, "block/code");
  const entitySet = useEntitySetContext();

  return (
    <div className="border p-2 w-full relative">
      {isEditing && entitySet.permissions.write ? (
        <CodeEditor
          initialValue={codeValue?.data?.value || ""}
          entityID={props.entityID}
        />
      ) : (
        <ErrorBoundary
          resetKeys={[codeValue?.data?.value]}
          fallbackRender={(props: {
            error: any;
            resetErrorBoundary: () => void;
          }) => {
            return (
              <ErrorFallback
                error={props.error}
                resetBoundary={props.resetErrorBoundary}
              />
            );
          }}
        >
          <Result
            code={codeValue?.data?.value || ""}
            entityID={props.entityID}
            blockProps={props}
          />
        </ErrorBoundary>
      )}

      {entitySet.permissions.write && (
        <button
          className="absolute top-0 right-0 bg-secondary text-white px-2 py-1 rounded text-xs"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "View" : "Edit"}
        </button>
      )}
    </div>
  );
}

const CodeEditor = ({
  initialValue,
  entityID,
}: {
  initialValue: string;
  entityID: string;
}) => {
  const [localCodeValue, setLocalCodeValue] = useState(initialValue);
  const [prompt, setPrompt] = useState("");
  const { rep } = useReplicache();
  const { complete, completion, isLoading } = useCompletion({
    api: "/api/completions",
  });

  useEffect(() => {
    setLocalCodeValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (completion) {
      const codeMatch = completion.match(/```js\n([\s\S]*?)\n```/);
      if (codeMatch && codeMatch[1]) {
        const generatedCode = codeMatch[1].trim();
        setLocalCodeValue(generatedCode);
        updateCode(generatedCode);
      }
    }
  }, [completion]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.currentTarget.value;
    setLocalCodeValue(newCode);
    updateCode(newCode);
  };

  const updateCode = (newCode: string) => {
    rep?.mutate.assertFact({
      entity: entityID,
      attribute: "block/code",
      data: { type: "string", value: newCode },
    });
  };

  const handleGenerate = async () => {
    await complete(prompt);
  };

  const handleUpdate = async () => {
    const updatePrompt = `${prompt}\n\nExisting code:\n\`\`\`js\n${localCodeValue}\n\`\`\``;
    await complete(updatePrompt);
  };

  return (
    <div>
      <div className="mb-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt to generate or update code"
          className="w-full p-2 border rounded"
        />
        <div className="flex gap-2 mt-2">
          <ButtonPrimary onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate New"}
          </ButtonPrimary>
          <ButtonPrimary onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Existing"}
          </ButtonPrimary>
        </div>
      </div>
      <div className="grow-wrap" data-replicated-value={localCodeValue}>
        <textarea
          className="w-full border h-full min-h-[200px]"
          value={localCodeValue}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

const ErrorFallback = (props: { error: any; resetBoundary: () => void }) => {
  return (
    <div role="alert">
      <pre>{props.error.message}</pre>
    </div>
  );
};

const Result = (props: {
  code: string;
  entityID: string;
  blockProps: BlockProps;
}) => {
  const { permissions } = useEntitySetContext();

  let result = useMemo(() => {
    if (props.code === "") {
      return {
        result: () => (
          <div>
            {permissions.write
              ? "Hit 'Edit' to write a custom code block."
              : "This is an empty custom block."}
          </div>
        ),
      };
    }

    try {
      let scopeeval = new Compartment({
        globals: {
          React: {
            useState: useState,
            createElement: createElement,
          },
          setInterval: (cb: () => void, i: number) => {
            return window.setInterval(cb, i);
          },
          clearInterval: (i: number) => {
            return window.clearInterval(i);
          },
          scanIndex: scanIndex,
          useState,
          RenderedTextBlock,
          useEffect,
          useSubscribe,
          useReplicache,
          useEntity,
          TextBlock,
          elementId,
          ctx: { entityID: props.entityID },
        },
        __options__: true,
      });
      let code = transform(
        `
        (props)=> {
          ${props.code}
        }
        `,
        {
          presets: ["react"],
        },
      ).code;
      return { result: scopeeval.evaluate(code || "") };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [props.code, props.entityID, permissions.write]);

  let NewComponent = result.result;
  if (result.result) return <NewComponent {...props.blockProps} />;
  return <div>{result.error}</div>;
};
