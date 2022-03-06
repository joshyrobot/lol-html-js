// Copyright 2022 Josh <dev@jotch.dev>. MIT license.

import type { IComment, IElement } from "./mod.js";

interface UnderlyingAttributes {
	get_all_attributes(): Array<[string, string]>;
	set_attribute(n: string, v: string): void;
	remove_attribute(n: string): void;
	remove_all_attributes(): void;
}
class AttributeMap extends Map<string, string> {
	#underlying: UnderlyingAttributes;
	constructor(underlying: UnderlyingAttributes) {
		super();
		// we cant use the super constructor for this because it attempts to call our custom `.set()`
		for (const [k, v] of underlying.get_all_attributes()) {
			super.set(k, v);
		}
		this.#underlying = underlying;
	}

	set(name: string, value: string) {
		if (typeof name !== "string" || typeof value !== "string") {
			throw new TypeError("name and value must be strings");
		}

		this.#underlying.set_attribute(name, value);
		return super.set(name, value);
	}
	delete(name: string) {
		if (typeof name !== "string") {
			throw new TypeError("name must be a string");
		}

		this.#underlying.remove_attribute(name);
		return super.delete(name);
	}
	clear() {
		this.#underlying.remove_all_attributes();
		return super.clear();
	}
}

interface UnderlyingElement extends UnderlyingAttributes {
	get_tag_name(): string;
	set_tag_name(n: string): void;

	get_namespace_uri(): string;
}
export class Element implements IElement {
	#underlying: UnderlyingElement;
	constructor(underlying: UnderlyingElement) {
		this.#underlying = underlying;
	}

	#tagName?: string;
	get tagName() {
		if (this.#tagName === undefined) {
			this.#tagName = this.#underlying.get_tag_name();
		}

		return this.#tagName;
	}
	set tagName(newName) {
		this.#underlying.set_tag_name(newName);
		this.#tagName = newName;
	}

	#namespaceURI?: string;
	get namespaceURI() {
		if (this.#namespaceURI === undefined) {
			this.#namespaceURI = this.#underlying.get_namespace_uri();
		}

		return this.#namespaceURI;
	}

	#attributes?: Map<string, string>;
	get attributes() {
		if (this.#attributes === undefined) {
			this.#attributes = new AttributeMap(this.#underlying);
		}
		return this.#attributes;
	}
}

interface UnderlyingComment {
	get_text(): string;
	set_text(t: string): void;
}
export class Comment implements IComment {
	#underlying: UnderlyingComment;
	constructor(underlying: UnderlyingComment) {
		this.#underlying = underlying;
	}

	#contents?: string;
	get contents() {
		if (this.#contents === undefined) {
			this.#contents = this.#underlying.get_text();
		}

		return this.#contents;
	}
	set contents(newContents) {
		this.#underlying.set_text(newContents);
		this.#contents = newContents;
	}
}
