declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export interface MammothOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer | ArrayBuffer;
    path?: string;
  }

  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
}
