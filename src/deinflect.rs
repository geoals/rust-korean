use std::collections::HashMap;
use serde::{Deserialize, Serialize};
#[derive(Debug, Deserialize, Serialize)]
pub struct DeinflectRule {
    kanaIn: String,
    kanaOut: String,
    rulesIn: Vec<String>,
    rulesOut: Vec<String>,
}

pub type DeinflectionRuleMap = HashMap<String, Vec<DeinflectRule>>;

pub fn get_deinflection_rules() -> DeinflectionRuleMap {
    serde_json::from_str(include_str!("deinflect.json")).unwrap()
}
