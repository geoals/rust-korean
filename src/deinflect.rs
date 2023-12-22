use std::collections::HashMap;
use serde::{Deserialize, Serialize};
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DeinflectRule {
    #[serde(rename = "kanaIn")]
    pub kana_in: String,
    #[serde(rename = "kanaOut")]
    pub kana_out: String,
    #[serde(rename = "rulesIn")]
    rules_in: Vec<String>,
    #[serde(rename = "rulesOut")]
    rules_out: Vec<String>,
}

type DeinflectionRuleMap = HashMap<String, Vec<DeinflectRule>>;

pub fn get_deinflection_rules() -> Vec<DeinflectRule> {
    serde_json::from_str::<DeinflectionRuleMap>(include_str!("deinflect.json"))
        .unwrap()
        .values()
        .flatten()
        .cloned()
        .collect()
}
