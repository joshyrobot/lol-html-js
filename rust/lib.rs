// Copyright 2022 Josh <dev@jotch.dev>. MIT license.

use std::{cell::RefCell, rc::Rc};

use js_sys::Uint8Array;
use lol_html::{HtmlRewriter, OutputSink};
use wasm_bindgen::prelude::*;

mod js_types;
use js_types::JsRewriterSettings;

mod ref_wrapper;

#[derive(Clone)]
pub struct Uint8ArraySink(Rc<RefCell<Vec<Uint8Array>>>);
impl Uint8ArraySink {
	pub fn new() -> Self {
		Self(Rc::new(RefCell::new(vec![])))
	}
	pub fn take(&mut self) -> Vec<Uint8Array> {
		self.0.replace(vec![])
	}
}
impl OutputSink for Uint8ArraySink {
	fn handle_chunk(&mut self, chunk: &[u8]) {
		// NOTE: copy
		let chunk = Uint8Array::from(chunk);
		RefCell::borrow_mut(&self.0).push(chunk);
	}
}

#[wasm_bindgen(js_name = HTMLRewriterSync)]
pub struct HtmlRewriterSync {
	internal: HtmlRewriter<'static, Uint8ArraySink>,
	sink: Uint8ArraySink,
}

#[wasm_bindgen(js_class = HTMLRewriterSync)]
impl HtmlRewriterSync {
	#[wasm_bindgen(constructor)]
	pub fn new(settings: JsRewriterSettings) -> Result<HtmlRewriterSync, JsError> {
		let sink = Uint8ArraySink::new();
		Ok(Self {
			internal: HtmlRewriter::new(settings.into(), sink.clone()),
			sink,
		})
	}

	pub fn write(&mut self, data: &[u8]) -> Result<Vec<Uint8Array>, JsError> {
		self.internal.write(data)?;
		Ok(self.sink.take())
	}

	pub fn end(mut self) -> Result<Vec<Uint8Array>, JsError> {
		self.internal.end()?;
		Ok(self.sink.take())
	}
}
