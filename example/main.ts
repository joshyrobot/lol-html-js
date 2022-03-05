// Copyright 2022 Josh <dev@jotch.dev>. MIT license.

import { HTMLRewriterStream } from "../pkg/mod.js";

const stream = new HTMLRewriterStream({
	elementHandlers: [
		{
			selector: "label",
			element() {
				console.log("hey");
			},
		},
	],
});

const response = await fetch(new URL("index.html", import.meta.url));
await response.body?.pipeThrough(stream).pipeTo(Deno.stdout.writable);
