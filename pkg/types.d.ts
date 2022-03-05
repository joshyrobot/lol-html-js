export interface RewriterSettings {
	encoding?: string;
	strict?: boolean;
	enableEsiTags?: boolean;
	elementHandlers?: ElementContentHandler[];
}

export interface ElementContentHandler {
	selector: string;
	element?(e: Element): void;
	comments?(c: string): void;
	text?(t: string): void;
}

interface BaseNode {
	before(): void;
	after(): void;
	remove(): void;
	replace(): void;
	readonly replaced: boolean;
}

export interface Element extends BaseNode {
	tagName: string;
	readonly namespaceURI: string;
	readonly attributes: Map<string, string>;
}
export interface Comment extends BaseNode {
	contents: string;
}
export interface TextChunk extends BaseNode {
	readonly contents: string;
	readonly isLastInNode: boolean;
	readonly textType: TextType;
}
export type TextType =
	| "PLAIN_TEXT"
	| "RC_DATA"
	| "RAW_TEXT"
	| "SCRIPT_DATA"
	| "DATA"
	| "CDATA_SECTION";

export declare class HTMLRewriterSync {
	constructor(settings: RewriterSettings);
	write(data: Uint8Array): Array<Uint8Array>;
	end(): Array<Uint8Array>;
}
export declare class HTMLRewriterStream extends TransformStream<Uint8Array, Uint8Array> {
	constructor(settings: RewriterSettings);
}
export declare function rewriteHTMLBuffer(settings: RewriterSettings, data: Uint8Array): Uint8Array;
