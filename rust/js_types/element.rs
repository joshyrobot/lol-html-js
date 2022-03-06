use js_sys::{Array, Error};
use lol_html::html_content::Element;
use wasm_bindgen::prelude::*;

use crate::ref_wrapper::RefWrapper;

#[wasm_bindgen(raw_module = "./wrappers.js")]
extern "C" {
	#[wasm_bindgen(js_name = Element)]
	pub type JsElement;

	#[wasm_bindgen(constructor, js_class = Element)]
	pub fn new(underlying: JsUnderlyingElement) -> JsElement;
}

#[wasm_bindgen]
pub struct JsUnderlyingElement(pub(crate) RefWrapper<Element<'static, 'static>>);

impl JsUnderlyingElement {
	fn get_error() -> Error {
		Error::new("woah")
	}

	unsafe fn get(&self) -> Result<&'_ Element<'static, 'static>, Error> {
		self.0.get().ok_or_else(Self::get_error)
	}

	unsafe fn get_mut(&mut self) -> Result<&'_ mut Element<'static, 'static>, Error> {
		self.0.get_mut().ok_or_else(Self::get_error)
	}
}

#[wasm_bindgen]
impl JsUnderlyingElement {
	pub fn get_tag_name(&self) -> Result<String, Error> {
		Ok(unsafe { self.get()?.tag_name() })
	}
	pub fn set_tag_name(&mut self, name: &str) -> Result<(), Error> {
		unsafe {
			self.get_mut()?.set_tag_name(name).unwrap();
		}
		Ok(())
	}

	pub fn get_namespace_uri(&self) -> Result<String, Error> {
		Ok(unsafe { String::from(self.get()?.namespace_uri()) })
	}

	pub fn get_all_attributes(&self) -> Result<Array, Error> {
		// pub fn get_all_attributes(&self) -> Array {
		Ok(unsafe {
			self.get()?
				.attributes()
				.iter()
				.map(|a| Array::of2(&a.name().into(), &a.value().into()))
				.collect()
		})
	}
	pub fn set_attribute(&mut self, name: &str, value: &str) -> Result<(), Error> {
		unsafe {
			self.get_mut()?.set_attribute(name, value).unwrap();
		}
		Ok(())
	}
	pub fn remove_attribute(&mut self, name: &str) -> Result<(), Error> {
		unsafe {
			self.get_mut()?.remove_attribute(name);
		}
		Ok(())
	}
	pub fn remove_all_attributes(&mut self) -> Result<(), Error> {
		unsafe {
			let el = self.get_mut()?;
			let names: Vec<_> = el.attributes().iter().map(|a| a.name()).collect();
			for name in names {
				el.remove_attribute(&name);
			}
		}
		Ok(())
	}
}
