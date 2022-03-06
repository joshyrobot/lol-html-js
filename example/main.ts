// Copyright 2022 Josh <dev@jotch.dev>. MIT license.

import { HTMLRewriterStream } from "../pkg/mod.js";

const stream = new HTMLRewriterStream({
	elementHandlers: [
		{
			selector: "label",
			element(el) {
				el.attributes.delete("delete-attr");
				el.attributes.set("foo", "bar");

				let attributeString = "";
				const attributeStyles = [];
				for (const [name, value] of el.attributes) {
					attributeString += ` %c${name}%c=%c"${value}"`;
					attributeStyles.push(
						"color: green",
						"",
						"color: yellow",
					);
				}

				console.log(
					`<%c${el.tagName}${attributeString}%c>`,
					"color: blue",
					...attributeStyles,
					"",
				);
			},
			comments(cm) {
				console.log(`Found comment! %c"${cm.text}"`, "color: yellow");
				cm.text = "[redacted]";
			},
		},
	],
});

const response = await fetch(new URL("index.html", import.meta.url));
await response.body?.pipeThrough(stream).pipeTo(Deno.stdout.writable);
