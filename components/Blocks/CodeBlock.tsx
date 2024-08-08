import { Block, BlockProps, focusBlock, ListMarker } from "components/Blocks";
import "ses";
import { useMemo, useState, createElement, useEffect, useRef } from "react";
import { useSmoker, useToaster } from "components/Toast";
import { transform } from "@babel/standalone";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import { TextBlock } from "./TextBlock";
import { useEntity } from "src/replicache";

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
  let [state, setState] = useState("");
  return (
    <div className="border p-2 w-full">
      <textarea
        className="w-full"
        value={state}
        onChange={(e) => setState(e.currentTarget.value)}
      />
      <ErrorBoundary
        resetKeys={[state]}
        fallbackRender={(props) => {
          return (
            <ErrorFallback
              error={props.error}
              resetBoundary={props.resetErrorBoundary}
            />
          );
        }}
      >
        <Result code={state} entityID={props.entityID} blockProps={props} />
      </ErrorBoundary>
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
  let result = useMemo(() => {
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
        },
      ).code;
      return { result: scopeeval.evaluate(code || "") };
    } catch (e) {
      return { error: e.message };
    }
  }, [props.code, props.entityID]);
  let NewComponent = result.result;
  if (result.result) return <NewComponent {...props.blockProps} />;
  return <div>{result.error}</div>;
};
