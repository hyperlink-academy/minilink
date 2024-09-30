"use client";

import { htmlToMarkdown } from "src/htmlMarkdownParsers";
import { action } from "./action";
import { useState } from "react";
export default function AdminPage() {
  let [state, setState] = useState<{ root_entity: string }[]>([]);
  return (
    <label className="w-full flex flex-row gap-2 items-stretch p-4 bg-test">
      <button
        onClick={async () => {
          action();
        }}
      >
        run
      </button>
    </label>
  );
}
