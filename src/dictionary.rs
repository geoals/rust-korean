use std::collections::HashMap;
use std::fs::read_to_string;
use serde::{Deserialize, Serialize};

/// Refer to https://github.com/themoeway/yomitan/blob/master/ext/data/schemas/dictionary-term-bank-v3-schema.json for more details
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Entry {
    headword: Headword,
    /// Empty string if it is the same as the headword
    reading: String,
    tags: String,
    /// Deinflection rule identifier such as v or adj, used to validate deinflection. Empty string indicate the word isn't inflected, such as nouns.
    deinflection_rule: String,
    frequency: i32,
    definitions: Vec<String>,
    sequence_number: i32,
    tags2: String,
}

#[allow(dead_code)]
impl Entry {
    pub fn get_first_definition(&self) -> Option<&String> {
        self.definitions.first()
    }

    pub fn definitions(&self) -> &Vec<String> { &self.definitions }
}

type Headword = String;

pub struct Dictionary {
    terms_map: HashMap<Headword, Vec<Entry>>,
}

#[allow(dead_code)]
impl Dictionary {
    pub fn new(path: &str) -> Self {
        let terms_vec: Vec<Entry> = serde_json::from_str(&read_to_string(path).unwrap()).unwrap();
        let terms_map = terms_vec
            .iter()
            .fold(HashMap::new(), |mut map: HashMap<Headword, Vec<Entry>>, term| {
                map.entry(term.headword.clone()).or_default().push(term.clone());
                map
            });
        Self {
            terms_map,
        }
    }

    pub fn get_terms(&self) -> Vec<&Entry> {
        self.terms_map.values().flatten().clone().collect()
    }

    pub fn search(&self, word: &str) -> Option<&Vec<Entry>> {
        self.terms_map.get(word)
    }

    pub fn search_with_deinflection_rules(&self, word: &str, deinflection_rules: Vec<String>) -> Option<Vec<Entry>> {
        self.terms_map.get(word)
            .map(|terms| {
                terms.clone().into_iter()
                    .filter(|term| {
                        deinflection_rules.contains(&term.deinflection_rule)
                    })
                    .collect()
            })
    }
}

const KRDICT_STAR: char = '★';

pub trait KrDictEntry {
    /// Some definitions in the krdict dictionaries have one to three stars at the beginning of the definition
    /// indicating frequency. Three stars indicate the most frequent words.
    ///
    /// Returns the number of stars
    fn krdict_stars(&self) -> u8;
}

impl KrDictEntry for Entry {
    fn krdict_stars(&self) -> u8 {
        self.definitions.first().unwrap_or(&"".to_string())
            .chars().take(3)
            .fold(0, |acc, c| {
                acc + (c == KRDICT_STAR) as u8

            })

    }
}