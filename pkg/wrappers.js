// Copyright 2022 Josh <dev@jotch.dev>. MIT license.
class AttributeMap extends Map {
    #underlying;
    constructor(underlying) {
        super();
        // we cant use the super constructor for this because it attempts to call our custom `.set()`
        for (const [k, v] of underlying.get_all_attributes()) {
            super.set(k, v);
        }
        this.#underlying = underlying;
    }
    set(name, value) {
        if (typeof name !== "string" || typeof value !== "string") {
            throw new TypeError("name and value must be strings");
        }
        this.#underlying.set_attribute(name, value);
        return super.set(name, value);
    }
    delete(name) {
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
export class Element {
    #underlying;
    constructor(underlying) {
        this.#underlying = underlying;
    }
    #tagName;
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
    #namespaceURI;
    get namespaceURI() {
        if (this.#namespaceURI === undefined) {
            this.#namespaceURI = this.#underlying.get_namespace_uri();
        }
        return this.#namespaceURI;
    }
    #attributes;
    get attributes() {
        if (this.#attributes === undefined) {
            this.#attributes = new AttributeMap(this.#underlying);
        }
        return this.#attributes;
    }
}
export class Comment {
    #underlying;
    constructor(underlying) {
        this.#underlying = underlying;
    }
    #contents;
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
