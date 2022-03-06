// Copyright 2022 Josh <dev@jotch.dev>. MIT license.

/// <reference types="./mod.d.ts" />
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
export type TextType =
	| "PLAIN_TEXT"
	| "RC_DATA"
	| "RAW_TEXT"
	| "SCRIPT_DATA"
	| "DATA"
	| "CDATA_SECTION";

import init, { HTMLRewriterSync as _HTMLRewriterSync } from "./bindings.js";
import wasm from "./wasm.js";

await init(wasm);

export class HTMLRewriterSync {
	#internal: _HTMLRewriterSync;
	constructor(settings: RewriterSettings) {
		this.#internal = new _HTMLRewriterSync(settings);
	}
	write(data: Uint8Array): Array<Uint8Array> {
		return this.#internal.write(data);
	}
	end(): Array<Uint8Array> {
		return this.#internal.end();
	}
}

export class HTMLRewriterStream extends TransformStream<Uint8Array, Uint8Array> {
	constructor(settings: RewriterSettings) {
		const rewriter = new HTMLRewriterSync(settings);

		super({
			transform(chunk, controller) {
				for (const output of rewriter.write(chunk)) {
					controller.enqueue(output);
				}
			},
			flush(controller) {
				for (const output of rewriter.end()) controller.enqueue(output);
			},
		});
	}
}

export function rewriteHTMLBuffer(settings: RewriterSettings, data: Uint8Array) {
	const rewriter = new HTMLRewriterSync(settings);
	const chunks = [
		...rewriter.write(data),
		...rewriter.end(),
	];

	let length = 0;
	for (const chunk of chunks) length += chunk.length;

	const output = new Uint8Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		output.set(chunk, offset);
		offset += chunk.length;
	}

	return output;
}
