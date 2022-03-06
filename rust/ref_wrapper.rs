// Copyright 2019-2022 Cloudflare. BSD-3-Clause license.

use std::{cell::Cell, marker::PhantomData, mem, rc::Rc};

use lol_html::html_content::{Comment, Element};

pub(crate) struct Anchor<'r> {
	poisoned: Rc<Cell<bool>>,
	lifetime: PhantomData<&'r mut ()>,
}

impl<'r> Anchor<'r> {
	fn new(poisoned: Rc<Cell<bool>>) -> Self {
		Anchor {
			poisoned,
			lifetime: PhantomData,
		}
	}
}

impl Drop for Anchor<'_> {
	fn drop(&mut self) {
		self.poisoned.replace(true);
	}
}

// NOTE: wasm_bindgen doesn't allow structures with lifetimes. To workaround that
// we create a wrapper that erases all the lifetime information from the inner reference
// and provides an anchor object that keeps track of the lifetime in the runtime.
//
// When anchor goes out of scope, wrapper becomes poisoned and any attempt to get inner
// object results in exception.
pub(crate) struct RefWrapper<R> {
	inner_ptr: *mut R,
	poisoned: Rc<Cell<bool>>,
}

impl<R> RefWrapper<R> {
	unsafe fn wrap<'r, I>(inner: &'r mut I) -> (Self, Anchor<'r>) {
		let wrap = Self {
			inner_ptr: mem::transmute(inner),
			poisoned: Rc::new(Cell::new(false)),
		};

		let anchor = Anchor::new(Rc::clone(&wrap.poisoned));

		(wrap, anchor)
	}

	pub(crate) unsafe fn get(&self) -> Option<&R> {
		if self.poisoned.get() {
			None
		} else {
			self.inner_ptr.as_ref()
		}
	}

	pub(crate) unsafe fn get_mut(&mut self) -> Option<&mut R> {
		if self.poisoned.get() {
			None
		} else {
			self.inner_ptr.as_mut()
		}
	}
}

pub(crate) trait Wrappable {
	type Static;

	fn get_wrapped(&mut self, cb: impl FnOnce(RefWrapper<Self::Static>) -> ())
	where
		Self: Sized,
	{
		// wrapping is safe as long as the anchor is definitely dropped
		unsafe {
			let (wrapper, anchor) = RefWrapper::wrap(self);

			cb(wrapper);

			mem::drop(anchor);
		}
	}
}

impl Wrappable for Element<'_, '_> {
	type Static = Element<'static, 'static>;
}
impl Wrappable for Comment<'_> {
	type Static = Comment<'static>;
}
