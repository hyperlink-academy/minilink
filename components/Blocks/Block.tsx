"use client";

import { useReplicache } from "src/replicache";
import { useEffect } from "react";
import { useUIState } from "src/useUIState";
import { useEditorStates } from "src/state/useEditorState";
import { useBlockMouseHandlers } from "./useBlockMouseHandlers";
import { useLongPress } from "src/hooks/useLongPress";
import { useEntitySetContext } from "components/EntitySetProvider";

import { isTextBlock } from "src/utils/isTextBlock";
import { focusBlock } from "src/utils/focusBlock";
import { elementId } from "src/utils/elementId";
import { indent, outdent } from "src/utils/list-operations";
import { generateKeyBetween } from "fractional-indexing";
import { v7 } from "uuid";

import { CollectionBlock } from "./CollectionBlock";
import { TextBlock } from "components/Blocks/TextBlock";
import { ImageBlock } from "./ImageBlock";
import { CardBlock } from "./CardBlock";
import { ExternalLinkBlock } from "./ExternalLinkBlock";
import { MailboxBlock } from "./MailboxBlock";
import { HeadingBlock } from "./HeadingBlock";
import { Block as BlockType, ListMarker } from ".";

export type BlockProps = {
  entityID: string;
  parent: string;
  position: string;
  nextBlock: BlockType | null;
  previousBlock: BlockType | null;
  nextPosition: string | null;
} & BlockType;

export function Block(props: BlockProps) {
  let { rep } = useReplicache();
  let mouseHandlers = useBlockMouseHandlers(props);

  let { isLongPress, handlers } = useLongPress(() => {
    if (isLongPress.current) {
      focusBlock(
        { type: "card", value: props.entityID, parent: props.parent },
        { type: "start" },
      );
    }
  }, mouseHandlers.onMouseDown);

  let first = props.previousBlock === null;

  let selectedBlocks = useUIState((s) => s.selectedBlock);

  let actuallySelected = useUIState(
    (s) => !!s.selectedBlock.find((b) => b.value === props.entityID),
  );
  let hasSelectionUI =
    (!isTextBlock[props.type] || selectedBlocks.length > 1) && actuallySelected;

  let nextBlockSelected = useUIState((s) =>
    s.selectedBlock.find((b) => b.value === props.nextBlock?.value),
  );
  let prevBlockSelected = useUIState((s) =>
    s.selectedBlock.find((b) => b.value === props.previousBlock?.value),
  );

  let entity_set = useEntitySetContext();

  useEffect(() => {
    if (!hasSelectionUI || !rep) return;
    let r = rep;
    let listener = async (e: KeyboardEvent) => {
      // keymapping for textBlocks is handled in TextBlock/keymap

      if (e.defaultPrevented) return;

      //if no permissions, do nothing
      if (!entity_set.permissions.write) return;

      if (e.key === "Tab") {
        // if tab or shift tab & not a textBlock, indent or outdent
        if (isTextBlock[props.type]) return;
        if (e.shiftKey) {
          e.preventDefault();
          outdent(props, props.previousBlock, rep);
        } else {
          e.preventDefault();
          if (props.previousBlock) indent(props, props.previousBlock, rep);
        }
      }

      // if arrow down, focus next block
      if (e.key === "ArrowDown") {
        e.preventDefault();
        let nextBlock = props.nextBlock;
        if (nextBlock && useUIState.getState().selectedBlock.length <= 1)
          focusBlock(nextBlock, {
            type: "top",
            left: useEditorStates.getState().lastXPosition,
          });
        if (!nextBlock) return;
      }

      // if arrow up, focus next block
      if (e.key === "ArrowUp") {
        e.preventDefault();
        let prevBlock = props.previousBlock;
        if (prevBlock && useUIState.getState().selectedBlock.length <= 1) {
          focusBlock(prevBlock, {
            type: "bottom",
            left: useEditorStates.getState().lastXPosition,
          });
        }
        if (!prevBlock) return;
      }

      // if backspace, remove block, focus previous block
      if (e.key === "Backspace") {
        if (isTextBlock[props.type]) return;
        if (props.type === "card" || props.type === "mailbox") return;
        e.preventDefault();
        r.mutate.removeBlock({ blockEntity: props.entityID });
        useUIState.getState().closeCard(props.entityID);
        let prevBlock = props.previousBlock;
        if (prevBlock) focusBlock(prevBlock, { type: "end" });
      }

      // if enter, create new block
      if (e.key === "Enter") {
        let newEntityID = v7();
        let position;
        // if it's a list, create a new list item at the same depth
        if (props.listData) {
          let hasChild =
            props.nextBlock?.listData &&
            props.nextBlock.listData.depth > props.listData.depth;
          position = generateKeyBetween(
            hasChild ? null : props.position,
            props.nextPosition,
          );
          await r?.mutate.addBlock({
            newEntityID,
            factID: v7(),
            permission_set: entity_set.set,
            parent: hasChild ? props.entityID : props.listData.parent,
            type: "text",
            position,
          });
          await r?.mutate.assertFact({
            entity: newEntityID,
            attribute: "block/is-list",
            data: { type: "boolean", value: true },
          });
        }
        // if it's not a list, create a new block between current and next block
        if (!props.listData) {
          position = generateKeyBetween(props.position, props.nextPosition);
          await r?.mutate.addBlock({
            newEntityID,
            factID: v7(),
            permission_set: entity_set.set,
            parent: props.parent,
            type: "text",
            position,
          });
        }
        setTimeout(() => {
          document.getElementById(elementId.block(newEntityID).text)?.focus();
        }, 10);
      }
      // if escape, deselect and defocus block
      if (e.key === "Escape") {
        e.preventDefault();

        useUIState.setState({ selectedBlock: [] });
        useUIState.setState({ focusedBlock: null });
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [entity_set, hasSelectionUI, props, rep]);

  return (
    <div
      {...mouseHandlers}
      {...handlers}
      className="blockWrapper relative flex"
    >
      {hasSelectionUI && selectedBlocks.length > 1 && (
        <div
          className={`
          blockSelectionBG pointer-events-none bg-border-light
          absolute right-2 left-2 bottom-0
          ${selectedBlocks.length > 1 ? "Multiple-Selected" : ""}
          ${actuallySelected ? "selected" : ""}
          ${first ? "top-2" : "top-0"}
          ${!prevBlockSelected && "rounded-t-md"}
          ${!nextBlockSelected && "rounded-b-md"}
          `}
        />
      )}
      <BaseBlock {...props} />
    </div>
  );
}

export const BaseBlock = (props: BlockProps & { preview?: boolean }) => {
  return (
    <div
      data-entityid={props.entityID}
      className={`
      blockContent relative
      grow flex flex-row gap-2
      px-3 sm:px-4
      ${
        props.type === "heading" ||
        (props.listData && props.nextBlock?.listData)
          ? "pb-0"
          : "pb-2"
      }
      ${!props.previousBlock ? `${props.type === "heading" || props.type === "text" ? "pt-2 sm:pt-3" : "pt-3 sm:pt-4"}` : "pt-1"}
  `}
      id={elementId.block(props.entityID).container}
    >
      {props.listData && <ListMarker {...props} />}

      {props.type === "card" ? (
        <CardBlock {...props} renderPreview={!props.preview} />
      ) : props.type === "text" ? (
        <TextBlock {...props} className="" previewOnly={props.preview} />
      ) : props.type === "heading" ? (
        <HeadingBlock {...props} preview={props.preview} />
      ) : props.type === "image" ? (
        <ImageBlock {...props} />
      ) : props.type === "link" ? (
        <ExternalLinkBlock {...props} />
      ) : props.type === "mailbox" ? (
        <div className="flex flex-col gap-4 w-full">
          <MailboxBlock {...props} />
        </div>
      ) : props.type === "collection" ? (
        <CollectionBlock {...props} />
      ) : null}
    </div>
  );
};