"use client";

import { useState } from "react";
import {
  BoldSmall,
  CloseTiny,
  ItalicSmall,
  RedoSmall,
  UndoSmall,
  UnderlineSmall,
  LinkTextToolbarSmall,
  ParagraphSmall,
  ListUnorderedSmall,
  Header1Small,
  Header2Small,
  Header3Small,
  ListOrderedSmall,
  ListIndentDecreaseSmall,
  ListIndentIncreaseSmall,
  BlockImageSmall,
  BlockLinkSmall,
  BlockCardSmall,
  BlockSmall,
  CheckTiny,
} from "components/Icons";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { Separator } from "components/Layout";

type textState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  header: "h1" | "h2" | "h3" | "p";
  list: "ordered" | "unordered" | "none";
  link: string | undefined;
};

let useTextState = create(
  combine(
    {
      bold: false,
      italic: false,
      underline: false,
      header: "p",
      list: "none",
      link: undefined as string | undefined,
    },
    (set) => ({
      toggleBold: () => set((state) => ({ bold: !state.bold })),
      toggleItalic: () => set((state) => ({ italic: !state.italic })),
      toggleUnderline: () => set((state) => ({ underline: !state.underline })),
      setHeader: (newHeader: "h1" | "h2" | "h3" | "p") =>
        set(() => ({ header: newHeader })),
      setList: (newList: "ordered" | "unordered" | "none") =>
        set(() => ({ list: newList })),
      setLink: (newLink: string | undefined) => set(() => ({ link: newLink })),
    }),
  ),
);

export const TextToolbar = () => {
  let [toolbarState, setToolbarState] = useState<
    "default" | "link" | "header" | "list" | "block"
  >("default");

  let state = useTextState();

  return (
    <>
      {toolbarState === "default" ? (
        <>
          <ToolbarButton onClick={() => {}}>
            <UndoSmall />
          </ToolbarButton>
          <ToolbarButton onClick={() => {}}>
            <RedoSmall />
          </ToolbarButton>
          <Separator />
          <ToolbarButton
            active={state.bold}
            onClick={() => {
              state.toggleBold();
            }}
          >
            <BoldSmall />
          </ToolbarButton>
          <ToolbarButton
            active={state.italic}
            onClick={() => {
              state.toggleItalic();
            }}
          >
            <ItalicSmall />
          </ToolbarButton>
          <ToolbarButton
            active={state.underline}
            onClick={() => {
              state.toggleUnderline();
            }}
          >
            <UnderlineSmall />
          </ToolbarButton>
          {/* possibly link is only available if text is actively selected  */}
          <ToolbarButton
            active={state.link !== undefined && state.link !== ""}
            onClick={() => {
              setToolbarState("link");
            }}
          >
            <LinkTextToolbarSmall />
          </ToolbarButton>
          <Separator />
          <ToolbarButton
            active
            onClick={() => {
              setToolbarState("header");
            }}
          >
            {state.header === "h1" ? (
              <Header1Small />
            ) : state.header === "h2" ? (
              <Header2Small />
            ) : state.header === "h3" ? (
              <Header3Small />
            ) : (
              <ParagraphSmall />
            )}
          </ToolbarButton>
          <Separator />
          <ToolbarButton
            active={state.list !== "none"}
            onClick={() => {
              setToolbarState("list");
            }}
          >
            {state.list === "ordered" ? (
              <ListOrderedSmall />
            ) : (
              <ListUnorderedSmall />
            )}
          </ToolbarButton>
          <Separator />
          <ToolbarButton
            onClick={() => {
              setToolbarState("block");
            }}
          >
            <BlockSmall />
          </ToolbarButton>
        </>
      ) : toolbarState === "link" ? (
        <LinkToolbar onClose={() => setToolbarState("default")} />
      ) : toolbarState === "header" ? (
        <HeaderToolbar onClose={() => setToolbarState("default")} />
      ) : toolbarState === "list" ? (
        <ListToolbar onClose={() => setToolbarState("default")} />
      ) : toolbarState === "block" ? (
        <BlockToolbar onClose={() => setToolbarState("default")} />
      ) : null}
    </>
  );
};

const LinkToolbar = (props: { onClose: () => void }) => {
  let state = useTextState();
  let [linkValue, setLinkValue] = useState(state.link);
  return (
    <div className=" w-full flex items-center gap-[6px]">
      <ToolbarButton
        active={state.link !== undefined && state.link !== ""}
        onClick={() => props.onClose}
      >
        <LinkTextToolbarSmall />
      </ToolbarButton>
      <Separator />
      <input
        className="w-full grow bg-transparent border-none outline-none "
        placeholder="www.leaflet.pub"
        value={linkValue}
        onChange={(e) => setLinkValue(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          className="hover:text-accent"
          onClick={() => {
            state.setLink(linkValue);
            props.onClose();
          }}
        >
          <CheckTiny />
        </button>
        <button className="hover:text-accent" onClick={() => props.onClose()}>
          <CloseTiny />
        </button>
      </div>
    </div>
  );
};

const HeaderToolbar = (props: { onClose: () => void }) => {
  let state = useTextState();

  return (
    // This Toolbar should close once the user starts typing again
    <div className="flex w-full justify-between items-center gap-4">
      <div className="flex items-center gap-[6px]">
        <ToolbarButton
          className="w-10 flex justify-center"
          active
          onClick={() => props.onClose()}
        >
          {state.header === "h1" ? (
            <Header1Small />
          ) : state.header === "h2" ? (
            <Header2Small />
          ) : state.header === "h3" ? (
            <Header3Small />
          ) : (
            <ParagraphSmall />
          )}{" "}
        </ToolbarButton>
        <Separator />
        <ToolbarButton
          onClick={() => {
            state.setHeader("h1");
          }}
          active={state.header === "h1"}
        >
          <Header1Small />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            state.setHeader("h2");
          }}
          active={state.header === "h2"}
        >
          <Header2Small />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            state.setHeader("h3");
          }}
          active={state.header === "h3"}
        >
          <Header3Small />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            state.setHeader("p");
            props.onClose();
          }}
          active={state.header === "p"}
          className="px-[6px]"
        >
          Paragraph
        </ToolbarButton>
      </div>
      <CloseToolbarButton onClose={props.onClose} />
    </div>
  );
};

const ListToolbar = (props: { onClose: () => void }) => {
  let state = useTextState();

  // This Toolbar should close once the user starts typing again
  return (
    <div className="flex w-full justify-between items-center gap-4">
      <div className="flex items-center gap-[6px]">
        <ToolbarButton
          onClick={() => props.onClose()}
          active={state.list !== "none"}
        >
          {state.list === "ordered" ? (
            <ListOrderedSmall />
          ) : (
            <ListUnorderedSmall />
          )}
        </ToolbarButton>
        <Separator />
        <ToolbarButton
          onClick={() => {
            state.list === "unordered"
              ? state.setList("none")
              : state.setList("unordered");
          }}
          active={state.list === "unordered"}
        >
          <ListUnorderedSmall />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            state.list === "ordered"
              ? state.setList("none")
              : state.setList("ordered");
          }}
          active={state.list === "ordered"}
        >
          <ListOrderedSmall />
        </ToolbarButton>

        {/* if there is no list and you click and indent button, then it should create a list */}
        <ToolbarButton>
          <ListIndentIncreaseSmall />
        </ToolbarButton>
        <ToolbarButton>
          <ListIndentDecreaseSmall />
        </ToolbarButton>
      </div>
      <CloseToolbarButton onClose={props.onClose} />
    </div>
  );
};

const BlockToolbar = (props: { onClose: () => void }) => {
  return (
    <div className="flex w-full justify-between items-center gap-4">
      <div className="flex items-center gap-[6px]">
        <ToolbarButton onClick={() => props.onClose()}>
          <BlockSmall />
        </ToolbarButton>
        <Separator />
        <ToolbarButton>
          <BlockImageSmall />
        </ToolbarButton>
        <ToolbarButton>
          <BlockLinkSmall />
        </ToolbarButton>
        <ToolbarButton>
          <BlockCardSmall />
        </ToolbarButton>
      </div>
      <CloseToolbarButton onClose={props.onClose} />
    </div>
  );
};

const ToolbarButton = (props: {
  textState?: textState;
  setTextState?: (textState: textState) => void;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
  active?: boolean;
}) => {
  return (
    <button
      className={`rounded-md text-secondary shrink-0  p-0.5 active:bg-border active:text-primary ${props.className} ${props.active ? "bg-border text-primary" : ""}`}
      onClick={() => {
        props.onClick && props.onClick();
      }}
    >
      {props.children}
    </button>
  );
};

const CloseToolbarButton = (props: { onClose: () => void }) => {
  return (
    <button className="hover:text-accent" onClick={() => props.onClose()}>
      <CloseTiny />
    </button>
  );
};
