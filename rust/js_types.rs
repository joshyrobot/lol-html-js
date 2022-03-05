// Copyright 2022 Josh <dev@jotch.dev>. MIT license.

use std::borrow::Cow;

use encoding_rs::Encoding;
use js_sys::Function;
use lol_html::{
	AsciiCompatibleEncoding,
	ElementContentHandlers,
	Selector,
	Settings as RewriterSettings,
};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
	pub type JsRewriterSettings;

	#[wasm_bindgen(method, getter)]
	pub fn encoding(this: &JsRewriterSettings) -> Option<String>;

	#[wasm_bindgen(method, getter)]
	pub fn strict(this: &JsRewriterSettings) -> Option<bool>;

	#[wasm_bindgen(method, getter, js_name = enableEsiTags)]
	pub fn enable_esi_tags(this: &JsRewriterSettings) -> Option<bool>;

	#[wasm_bindgen(method, getter, js_name = elementHandlers)]
	pub fn element_handlers(this: &JsRewriterSettings) -> Option<Vec<JsElementHandler>>;
}

impl From<JsRewriterSettings> for RewriterSettings<'_, '_> {
	fn from(value: JsRewriterSettings) -> Self {
		let mut settings = Self::default();

		if let Some(encoding) = value.encoding() {
			settings.encoding = Encoding::for_label(encoding.as_bytes())
				.and_then(AsciiCompatibleEncoding::new)
				.expect("invalid encoding");
		}
		if let Some(strict) = value.strict() {
			settings.strict = strict
		}
		if let Some(esi) = value.enable_esi_tags() {
			settings.enable_esi_tags = esi;
		}
		if let Some(element_handlers) = value.element_handlers() {
			settings
				.element_content_handlers
				.extend(element_handlers.into_iter().map(|e| e.into()));
		}

		settings
	}
}

#[wasm_bindgen]
extern "C" {
	pub type JsElementHandler;

	#[wasm_bindgen(method, getter)]
	pub fn selector(this: &JsElementHandler) -> String;

	#[wasm_bindgen(method, getter)]
	pub fn element(this: &JsElementHandler) -> Option<Function>;

	#[wasm_bindgen(method, getter)]
	pub fn comments(this: &JsElementHandler) -> Option<Function>;

	#[wasm_bindgen(method, getter)]
	pub fn text(this: &JsElementHandler) -> Option<Function>;
}

type ElementHandler<'s, 'h> = (Cow<'s, Selector>, ElementContentHandlers<'h>);

impl From<JsElementHandler> for ElementHandler<'_, '_> {
	fn from(value: JsElementHandler) -> Self {
		let selector = Cow::Owned(value.selector().parse().expect("invalid selector"));

		let mut handler = ElementContentHandlers::default();
		if let Some(callback) = value.element() {
			handler = handler.element(move |_element| {
				callback.call0(&JsValue::NULL).unwrap();
				Ok(())
			});
		}

		(selector, handler)
	}
}
