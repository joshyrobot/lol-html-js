#! /usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-env

// import { readLines } from "https://deno.land/std@0.128.0/io/mod.ts";

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

const wasmOptStatus = await Deno.run({
	cmd: [
		"wasm-opt",
		"./target/wasm32-bindgen-web/lib_bg.wasm",

		"--enable-reference-types",

		"-O3",

		"--output=./out/lib.wasm",
	],
}).status();
if (!wasmOptStatus.success) {
	console.error("Failed to optimize WASM binary.");
	Deno.exit(1);
}

const year = new Date().getFullYear();
const copyrightLine = `
// Copyright 2022-${year} Josh <dev@jotch.dev>. MIT license.
// Portions of the WASM binary Copyright 2019-${year} Cloudflare. BSD-3-Clause license.
`.trimStart();

await Deno.writeTextFile("./out/bindings.js", copyrightLine);
const bindingsFile = await Deno.open("./out/bindings.js", { append: true });
const generatedFile = await Deno.open("./target/wasm32-bindgen-web/lib.js");
await generatedFile.readable.pipeTo(bindingsFile.writable);
