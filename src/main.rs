use crate::deinflect::{DeinflectRule, get_deinflection_rules};

mod deinflect;
mod hangul;

fn main() {
    let deinflections = get_deinflection_rules();
    let flat = deinflections.values().flatten().collect::<Vec<&DeinflectRule>>();
}