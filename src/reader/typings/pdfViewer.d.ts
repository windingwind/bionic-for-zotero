export type { PDFPage, InternalRenderTask, Glyph, CanvasGraphics };

import type { PDFPageProxy } from "pdfjs-dist";
import type { CanvasGraphics } from "pdfjs-dist/types/src/display/canvas";

declare interface PDFPage {
  pdfPage: PDFPageProxy;
  canvas: HTMLCanvasElement;
}

declare interface InternalRenderTask {
  gfx: any;
}

type Glyph =
  | number
  | {
      unicode: string;
      isSpace: boolean;
    };
