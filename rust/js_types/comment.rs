use js_sys::Error;
use lol_html::html_content::Comment;
use wasm_bindgen::prelude::*;

use crate::ref_wrapper::RefWrapper;

#[wasm_bindgen(raw_module = "./wrappers.js")]
extern "C" {
	#[wasm_bindgen(js_name = Comment)]
	pub type JsComment;

	#[wasm_bindgen(constructor, js_class = Comment)]
	pub fn new(underlying: JsUnderlyingComment) -> JsComment;
}

#[wasm_bindgen]
pub struct JsUnderlyingComment(pub(crate) RefWrapper<Comment<'static>>);

impl JsUnderlyingComment {
	fn get_error() -> Error {
		Error::new("woah")
	}

	unsafe fn get(&self) -> Result<&'_ Comment<'static>, Error> {
		self.0.get().ok_or_else(Self::get_error)
	}

	unsafe fn get_mut(&mut self) -> Result<&'_ mut Comment<'static>, Error> {
		self.0.get_mut().ok_or_else(Self::get_error)
	}
}

#[wasm_bindgen]
impl JsUnderlyingComment {
	pub fn get_text(&self) -> Result<String, Error> {
		Ok(unsafe { self.get()?.text() })
	}
	pub fn set_text(&mut self, name: &str) -> Result<(), Error> {
		unsafe {
			self.get_mut()?.set_text(name).unwrap();
		}
		Ok(())
	}
}
