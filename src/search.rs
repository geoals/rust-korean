use crate::deinflect::{deinflect};
use crate::dictionary::{Dictionary, Entry};

/// Tries to find one or more matches of word or variations of it in the dictionary
pub fn get(word: &str, dictionary: &Dictionary) -> Vec<Entry> {
    find_matches_in_dictionary(word, dictionary)
}

fn find_matches_in_dictionary(word: &str, dictionary: &Dictionary) -> Vec<Entry> {
    // if the full word is in the dictionary, use only that
    if let Some(result) = dictionary.search(word) {
        return result.clone();
    }

    // if not, use the deinflected words, TODO: sorted by the number of stars
    for deinflection in deinflect(word) {
        // TODO how to decide which results to include when there are several inflections
        // use all ?
        if let Some(result) = dictionary.search_with_deinflection_rules(&deinflection.word, deinflection.rules) {
            return result.clone();
        }
    }

    // if there are no deinflected words, remove the last character and try again
    let char_count = word.chars().count();
    for i in 0..char_count {
        let word_without_last_char: String = word.chars().take(char_count - i).collect();
        if let Some(result) = dictionary.search(&word_without_last_char) {
            return result.clone();
        }
    }

    vec![]
}
