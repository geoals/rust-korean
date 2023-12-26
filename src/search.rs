use crate::deinflect::{deinflect};
use crate::dictionary::{Dictionary, Entry, KrDictEntry};

struct Match {
    match_type: MatchType,
    matches: Vec<Entry>,
}

#[derive(Clone, PartialEq, Ord, PartialOrd, Eq)]
enum MatchType {
    Exact,
    Deinflected,
    Partial,
}

/// Tries to find one or more matches of word or variations of it in the dictionary
///
/// Returns an attempt at finding the best matches by prioritizing exact matches before
/// deinflected matches, and deinflected matches before partial matches
pub fn get(word: &str, dictionary: &Dictionary) -> Vec<Entry> {
    let matches = find_matches_in_dictionary(word, dictionary);
    let match_types = matches.iter()
        .map(|m| m.match_type.clone())
        .collect::<Vec<MatchType>>();

    if match_types.contains(&MatchType::Exact) {
        return matches.into_iter()
            .filter(|m| m.match_type == MatchType::Exact)
            .flat_map(|m| m.matches).collect();
    }

    if match_types.contains(&MatchType::Deinflected) {
        return matches.into_iter()
            .filter(|m| m.match_type == MatchType::Deinflected)
            .flat_map(|m| m.matches).collect();
    }

    matches.into_iter().flat_map(|m| m.matches).collect()
}

/// Tries to find one or more matches of word or variations of it in the dictionary
/// Returns all matches
pub fn get_all(word: &str, dictionary: &Dictionary) -> Vec<Entry> {
    find_matches_in_dictionary(word, dictionary).into_iter()
        .flat_map(|m| m.matches)
        .collect()
}

fn find_matches_in_dictionary(word: &str, dictionary: &Dictionary) -> Vec<Match> {
    let mut matches = vec![];

    if let Some(value) = dictionary.search(word) {
        matches.push(Match { match_type: MatchType::Exact, matches: value.clone() });
    }

    if let Some(value) = search_deinflections_of_word(word, dictionary) {
        matches.push(Match { match_type: MatchType::Deinflected, matches: value.clone() });
    }

    // TODO modify this to detect which words are contained in a compound word or suffixed word
    if let Some(value) = search_partial(word, dictionary) {
        matches.push(Match { match_type: MatchType::Partial, matches: value.clone() });
    }

    sort(&mut matches);
    matches.dedup_by(|a, b| {
        a.matches.first().unwrap().sequence_number() == b.matches.first().unwrap().sequence_number()
    });
    matches
}

fn sort(matches: &mut [Match]) {
    matches.sort_by_key(|m| { m.match_type.clone() });

    matches.iter_mut().for_each(|m| {
        m.matches.sort_by(|a, b| {
            b.krdict_stars().cmp(&a.krdict_stars())
        })
    });
}

fn search_deinflections_of_word(word: &str, dictionary: &Dictionary) -> Option<Vec<Entry>> {
    let mut results = vec![];
    for deinflection in deinflect(word) {
        if let Some(result) = dictionary.search_with_deinflection_rules(&deinflection.word, deinflection.rules) {
            results.extend(result.clone());
        }
    }

    if !results.is_empty() {
        return Some(results);
    }
    None
}

// Remove the last character of the word until there is a match or the word is empty
fn search_partial(word: &str, dictionary: &Dictionary) -> Option<Vec<Entry>> {
    let char_count = word.chars().count();
    for i in 0..char_count {
        let word_without_last_char: String = word.chars().take(char_count - i).collect();
        if let Some(result) = dictionary.search(&word_without_last_char) {
            return Some(result.clone());
        }
    }
    None
}