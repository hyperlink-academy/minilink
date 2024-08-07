"use client";
import { useUIState } from "src/useUIState";
import { Media } from "./Media";
import { TextToolbar } from "./Toolbar";

export function DesktopCardFooter(props: { cardID: string }) {
  let focusedBlock = useUIState((s) => s.focusedBlock);
  let focusedBlockParentID =
    focusedBlock?.type === "card"
      ? focusedBlock.entityID
      : focusedBlock?.parent;
  return (
    <Media
      mobile={false}
      className="absolute bottom-4 w-full z-10 pointer-events-none"
    >
      {focusedBlock &&
        focusedBlock.type === "block" &&
        focusedBlockParentID === props.cardID && (
          <div className="pointer-events-auto w-fit mx-auto py-1 px-3 bg-bg-card border border-border rounded-full shadow-sm">
            <TextToolbar
              cardID={focusedBlockParentID}
              blockID={focusedBlock.entityID}
            />
          </div>
        )}
    </Media>
  );
}
