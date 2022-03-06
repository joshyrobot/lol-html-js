#! /usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-env

import { readAll, readerFromStreamReader } from "https://deno.land/std@0.128.0/streams/mod.ts";
import { encode } from "https://deno.land/std@0.128.0/encoding/base64.ts";

const root = new URL(".", import.meta.url).pathname;

// Run in the same directory as this script is located.
if (new URL(import.meta.url).protocol === "file:") {
	Deno.chdir(root);
} else {
	console.error("build.ts can only be run locally (from a file: URL).");
	Deno.exit(1);
}

const cargoStatus = await Deno.run({
	cmd: [
		"cargo",
		"build",
		"--release",
		"--target=wasm32-unknown-unknown",
	],
}).status();
if (!cargoStatus.success) {
	console.error("Failed to compile the Rust code to WASM.");
	Deno.exit(1);
}

const bindgenStatus = await Deno.run({
	cmd: [
		"wasm-bindgen",
		"./target/wasm32-unknown-unknown/release/lib.wasm",

		"--target=web",
		"--no-typescript",

		"--weak-refs",
		// "--reference-types",
		"--encode-into=always",

		"--out-dir=./target/wasm32-bindgen-web/",
	],
}).status();
if (!bindgenStatus.success) {
	console.error("Failed to generate JavaScript bindings from WASM.");
	Deno.exit(1);
}

const year = new Date().getFullYear();
const copyrightLine = `
	// Copyright 2022 Josh <dev@jotch.dev>. MIT license.
`.trimStart();

// optimize, compress, and encode WASM file
const wasmOpt = Deno.run({
	cmd: [
		"wasm-opt",
		"./target/wasm32-bindgen-web/lib_bg.wasm",

		"--enable-reference-types",

		"-O3",

		"--output=-",
	],
	stdout: "piped",
});

const compressedWasmStream = wasmOpt.stdout.readable.pipeThrough(
	new CompressionStream("gzip"),
);
const compressedWasm = await readAll(
	readerFromStreamReader(compressedWasmStream.getReader()),
);
const encodedWasm = encode(compressedWasm);

const wasmOptStatus = await wasmOpt.status();
if (!wasmOptStatus.success) {
	console.error("Failed to optimize WASM binary.");
	Deno.exit(1);
}

await Deno.writeTextFile(
	"./pkg/wasm.js",
	`
	${copyrightLine.trimEnd()}
	// Portions of the WASM binary Copyright 2019-${year} Cloudflare. BSD-3-Clause license.

	export default new Response(
		new ReadableStream({
			start(controller) {
				controller.enqueue(Uint8Array.from(atob("${encodedWasm}"), (A) => A.charCodeAt(0)));
				controller.close();
			},
		}).pipeThrough(new DecompressionStream("gzip")),
		{
			headers: {
				"content-type": "application/wasm",
			},
		},
	);
	`.trim().replaceAll(/^\t/gm, ""),
);

// prepend license header to bindings
await Deno.writeTextFile("./pkg/bindings.js", copyrightLine);
const bindingsFile = await Deno.open("./pkg/bindings.js", { append: true });
const generatedFile = await Deno.open("./target/wasm32-bindgen-web/lib.js");
await generatedFile.readable.pipeTo(bindingsFile.writable);

const TYPESCRIPT_VERSION = "4.6.2";
const tscEmitStatus = await Deno.run({
	cmd: [
		"npx",
		`--package=typescript@${TYPESCRIPT_VERSION}`,
		"tsc",

		"-p",
		"tsconfig.emit.json",
	],
}).status();
if (!tscEmitStatus.success) {
	console.error("Failed to compile TypeScript");
	Deno.exit(1);
}

const tscDeclarationsStatus = await Deno.run({
	cmd: [
		"npx",
		`--package=typescript@${TYPESCRIPT_VERSION}`,
		"tsc",

		"-p",
		"tsconfig.declarations.json",
	],
}).status();
if (!tscDeclarationsStatus.success) {
	console.error("Failed to emit TypeScript declarations");
	Deno.exit(1);
}
