use std::collections::HashSet;
use crate::deinflect::{DeinflectRule};
use crate::dictionary::{Dictionary, Term};
use crate::hangul::{is_hangul, HangulExt};

mod deinflect;
mod hangul;
mod dictionary;

fn main() {
    let first_cli_arg = std::env::args().nth(1).unwrap_or("".to_string());

    let deinflections_rules = deinflect::get_deinflection_rules();
    let dictionary = Dictionary::new("dictionaries/[KO-JA] KRDICT/term_bank_1.json");

    let matches = find_matches_in_dictionary(&first_cli_arg, &dictionary, &deinflections_rules);
    dbg!(matches);
}

// TODO move into dictionary.rs ? or somewhere else
fn find_matches_in_dictionary(word: &str, dictionary: &Dictionary, deinflection_rules: &Vec<DeinflectRule>) -> Vec<Term> {
    // if the full word is in the dictionary, use only that
    if let Some(result) = dictionary.search(word) {
        dbg!(&result);
        return result.clone();
    }

    // if not, use the deinflected words, TODO: sorted by the number of stars
    for deinflection in deinflect(word, deinflection_rules) {
        if let Some(result) = dictionary.search(&deinflection) {
            dbg!(&result);
            return result.clone();
        }
    }

    // if there are no deinflected words, remove the last character and try again
    vec![]
}

// Not all of the deinflected words are existing words
fn deinflect(word: &str, rules: &Vec<DeinflectRule>) -> HashSet<String> {
    let decomposed_term = word.to_jamo();

    rules.into_iter().filter(|rule| {
        // !rule.kanaIn.is_empty() &&
        decomposed_term.ends_with(&rule.kana_in) // TODO try to replace again with the rule in yomichan code?
    }).map(|rule| {
        decomposed_term.replace(&rule.kana_in, &rule.kana_out).to_hangul()
    }).filter(|rule| {
        rule.chars().all(is_hangul)
    }).collect()
}