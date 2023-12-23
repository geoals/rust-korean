use std::collections::{HashMap, HashSet};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use crate::hangul::{HangulExt, is_hangul};

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

// Possibly remove lazy_static and encapsulate this along with use of deinflect() into DictSearcher in search.rs
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

#[derive(PartialEq, Eq, Hash)]
pub struct DeinflectedMatch {
    pub word: String,
    pub rules: Vec<String>,
}

// Not all of the deinflected words are existing words
pub fn deinflect(word: &str) -> HashSet<DeinflectedMatch> {
    let decomposed_term = word.to_jamo();

    DEINFLECTION_RULES.iter().filter(|rule| {
        decomposed_term.ends_with(&rule.kana_in)
    }).map(|rule| {
        DeinflectedMatch {
            word: decomposed_term.replace(&rule.kana_in, &rule.kana_out).to_hangul(),
            rules: rule.rules_out.clone(),
        }
    }).filter(|rule| {
        rule.word.chars().all(is_hangul)
    }).collect()
}
