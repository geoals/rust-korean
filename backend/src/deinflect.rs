use crate::hangul::{is_hangul, HangulExt};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DeinflectRule {
    #[serde(rename = "kanaIn")]
    pub kana_in: String,
    #[serde(rename = "kanaOut")]
    pub kana_out: String,
    #[serde(rename = "rulesIn")]
    rules_in: Vec<String>,
    #[serde(rename = "rulesOut")]
    pub rules_out: Vec<String>,
}

type DeinflectionRuleMap = HashMap<String, Vec<DeinflectRule>>;

// Possibly remove lazy_static and encapsulate this along with Dictionary in main.rs
lazy_static! {
    static ref DEINFLECTION_RULES: Vec<DeinflectRule> = {
        serde_json::from_str::<DeinflectionRuleMap>(include_str!("../deinflect.json"))
            .unwrap()
            .values()
            .flatten()
            .cloned()
            .collect()
    };
}

#[derive(Debug, PartialEq, Eq, Hash)]
pub struct DeinflectedMatch {
    pub word: String,
    pub rules: Vec<String>,
}

// Not all of the deinflected words are existing words
pub fn deinflect(word: &str) -> HashSet<DeinflectedMatch> {
    // TODO: continue deinflecting to be able to parse compound grammar
    // should collect list of deinflection rules like:  았/었 <- 지만
    let decomposed_term = word.to_jamo();

    DEINFLECTION_RULES
        .iter()
        .filter(|rule| decomposed_term.ends_with(&rule.kana_in))
        .map(|rule| DeinflectedMatch {
            word: apply_inflection_rule(&decomposed_term, rule),
            rules: rule.rules_out.clone(),
        })
        .filter(|rule| rule.word.chars().all(is_hangul))
        .collect()
}

/// Panics if decomposed_term does not end with rule.kana_in
fn apply_inflection_rule(decomposed_term: &str, rule: &DeinflectRule) -> String {
    let mut input = decomposed_term.to_string();
    let index = input.rfind(&rule.kana_in).unwrap();
    input.replace_range(index.., &rule.kana_out);
    input.to_hangul()
}

mod tests {
    use super::*;

    #[test]
    fn apply_inflection_rule_on_term_with_more_than_one_of_the_same_jamo() {
        let deinflected = "ㄷㅡㄹㅣㄹ";
        let deinflection_rule = DeinflectRule {
            kana_in: "ㄹ".to_string(),
            kana_out: "ㄷㅏ".to_string(),
            rules_in: vec![],
            rules_out: vec!["v".to_string(), "adj".to_string()],
        };

        assert_eq!(
            apply_inflection_rule(deinflected, &deinflection_rule),
            "드리다"
        );
    }
}
