import { Block, BlockProps, focusBlock, ListMarker } from "components/Blocks";
import "ses";
import { useMemo, useState, createElement, useEffect, useRef } from "react";
import { useSmoker, useToaster } from "components/Toast";
import { transform } from "@babel/standalone";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import { TextBlock } from "./TextBlock";
import { useEntity, useReplicache } from "src/replicache";
import { useEntitySetContext } from "components/EntitySetProvider";

export function Test() {
  let smoker = useSmoker();
  return (
    <div>
      <button
        onClick={(e) => {
          smoker({
            text: "Hello world!",
            position: { x: e.clientX, y: e.clientY },
          });
        }}
      >
        Toast
      </button>
    </div>
  );
}

export function CodeBlock(props: BlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { rep } = useReplicache();
  const codeValue = useEntity(props.entityID, "block/code");
  const [localCodeValue, setLocalCodeValue] = useState("");
  const entitySet = useEntitySetContext();

  useEffect(() => {
    setLocalCodeValue(codeValue?.data?.value || "");
  }, [codeValue?.data?.value]);

  const updateCode = (newCode: string) => {
    setLocalCodeValue(newCode);
    rep?.mutate.assertFact({
      entity: props.entityID,
      attribute: "block/code",
      data: { type: "string", value: newCode },
    });
  };

  return (
    <div className="border p-2 w-full relative">
      {isEditing && entitySet.permissions.write ? (
        <div className="grow-wrap" data-replicated-value={localCodeValue}>
          <textarea
            autoFocus
            className="w-full border h-full"
            value={localCodeValue}
            onChange={(e) => updateCode(e.currentTarget.value)}
          />
        </div>
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
          useEntity,
          TextBlock,
          ctx: { entityID: props.entityID },
          Test: Test,
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
        }
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
