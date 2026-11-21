"use client";

import { CvPaged } from "./render/cv-document";
import type { CvDocument } from "@/lib/cv/types";

/** Bare A4 pages for the headless-Chromium PDF renderer (it waits for data-cv-ready="true"). */
export function CvPrintView({ doc }: { doc: CvDocument }) {
  return (
    <main className="bg-white">
      <CvPaged doc={doc} />
    </main>
  );
}
