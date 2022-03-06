export interface RewriterSettings {
    encoding?: string;
    strict?: boolean;
    enableEsiTags?: boolean;
    elementHandlers?: ElementContentHandler[];
}
export interface ElementContentHandler {
    selector: string;
    element?(this: null, e: IElement): void;
    comments?(this: null, c: IComment): void;
    text?(this: null, t: string): void;
}
export interface IElement {
    tagName: string;
    readonly namespaceURI: string;
    readonly attributes: Map<string, string>;
}
export interface IComment {
    contents: string;
}
export interface ITextChunk {
    readonly contents: string;
    readonly isLastInNode: boolean;
    readonly textType: TextType;
}
export declare type TextType = "PLAIN_TEXT" | "RC_DATA" | "RAW_TEXT" | "SCRIPT_DATA" | "DATA" | "CDATA_SECTION";
export declare class HTMLRewriterSync {
    #private;
    constructor(settings: RewriterSettings);
    write(data: Uint8Array): Array<Uint8Array>;
    end(): Array<Uint8Array>;
}
export declare class HTMLRewriterStream extends TransformStream<Uint8Array, Uint8Array> {
    constructor(settings: RewriterSettings);
}
export declare function rewriteHTMLBuffer(settings: RewriterSettings, data: Uint8Array): Uint8Array;
