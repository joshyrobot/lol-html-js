// Copyright 2022 Josh <dev@jotch.dev>. MIT license.
/// <reference types="./mod.d.ts" />
import init, { HTMLRewriterSync as _HTMLRewriterSync } from "./bindings.js";
import wasm from "./wasm.js";
await init(wasm);
export class HTMLRewriterSync {
    #internal;
    constructor(settings) {
        this.#internal = new _HTMLRewriterSync(settings);
    }
    write(data) {
        return this.#internal.write(data);
    }
    end() {
        return this.#internal.end();
    }
}
export class HTMLRewriterStream extends TransformStream {
    constructor(settings) {
        const rewriter = new HTMLRewriterSync(settings);
        super({
            transform(chunk, controller) {
                for (const output of rewriter.write(chunk)) {
                    controller.enqueue(output);
                }
            },
            flush(controller) {
                for (const output of rewriter.end())
                    controller.enqueue(output);
            },
        });
    }
}
export function rewriteHTMLBuffer(settings, data) {
    const rewriter = new HTMLRewriterSync(settings);
    const chunks = [
        ...rewriter.write(data),
        ...rewriter.end(),
    ];
    let length = 0;
    for (const chunk of chunks)
        length += chunk.length;
    const output = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        output.set(chunk, offset);
        offset += chunk.length;
    }
    return output;
}
