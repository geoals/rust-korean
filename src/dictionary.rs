#![allow(dead_code)]

use std::collections::HashMap;
use std::fs::read_to_string;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Term {
    headword: Headword,
    field2: String,
    field3: String,
    pos: String,
    field5: i32,
    definitions: Vec<String>,
    field7: i32,
    field8: String,
}

impl Term {
    pub fn get_first_definition(&self) -> &str {
        &self.definitions[0]
    }
}

type Headword = String;

pub struct Dictionary {
    terms_map: HashMap<Headword, Vec<Term>>
}

impl Dictionary {
    pub fn new(path: &str) -> Self {
        let terms_vec: Vec<Term> = serde_json::from_str(&read_to_string(path).unwrap()).unwrap();
        let terms_map = terms_vec
            .iter()
            .fold(HashMap::new(), |mut map: HashMap<Headword, Vec<Term>>, term| {
            map.entry(term.headword.clone()).or_default().push(term.clone());
            map
        });
        Self {
            terms_map,
        }
    }

    pub fn search(&self, word: &str) -> Option<&Vec<Term>> {
        self.terms_map.get(word)
    }

    /// Return number of stars from 0 to 3 for krdict dictionaries
    fn krdict_stars() {
        todo!()
    }
}