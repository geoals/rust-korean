use std::collections::HashMap;
use std::fs::read_to_string;
use regex::Regex;
use serde::{Deserialize, Serialize};

const KRDICT_STAR: char = '★';

lazy_static::lazy_static! {
    static ref LIST_ITEM_REGEX: Regex = Regex::new(r"^\d+\. ").unwrap();
    static ref HANJA_REGEX: Regex = Regex::new(r"〔(.*)〕").unwrap();
}

/// Refer to https://github.com/themoeway/yomitan/blob/master/ext/data/schemas/dictionary-term-bank-v3-schema.json for more details
#[derive(Debug, Clone, Deserialize)]
struct EntryJson {
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

// TODO: better seperation of concerns between parsing json and mapping to krdict entry?
impl EntryJson {
    fn to_krdict_entry(&self) -> KrDictEntry {
        let definition_full = self.definitions
            .first()
            .expect("definition is empty")
            .clone()
            .replace("\n(対訳語無し)", " (対訳語無し)"); // Fixes edgecase when there is no translation

        let stars = krdict_stars(&definition_full);
        KrDictEntry {
            headword: self.headword.clone(),
            reading: if self.reading.is_empty() { None } else { Some(self.reading.clone()) },
            part_of_speech: self.tags.clone(),
            deinflection_rule: if self.deinflection_rule.is_empty() { None } else { Some(self.deinflection_rule.clone()) },
            sequence_number: self.sequence_number,
            hanja: HANJA_REGEX.captures(&definition_full).map(|c| c.get(1).unwrap().as_str().to_string()),
            tl_definitions: tl_definition_lines(&definition_full).into_iter()
                .zip(tl_translation_lines(&definition_full))
                .map(|(definition, translation)| TargetLanguageDefinition { definition, translation })
                .collect(),
            definition_full,
            stars,
        }
    }
}

fn krdict_stars(definition: &String) -> u8 {
    definition
        .chars().take(3)
        .fold(0, |acc, c| {
            acc + (c == KRDICT_STAR) as u8
        })
}

fn tl_translation_lines(definition: &String) -> Vec<String> {
    definition
        .lines().skip(1)
        .step_by(3)
        .map(|l| l.to_string())
        .map(|l| LIST_ITEM_REGEX.replace(&l, "").to_string())
        .collect()
}

fn tl_definition_lines(definition: &String) -> Vec<String> {
    definition
        .lines().skip(3)
        .step_by(3)
        .map(|l| l.to_string())
        .collect()
}


#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct KrDictEntry {
    headword: String,
    reading: Option<String>,
    part_of_speech: String, // TODO translate to JP (or lang of the dict)
    /// "v" or "adj or None
    deinflection_rule: Option<String>,
    definition_full: String,
    sequence_number: i32,
    hanja: Option<String>,
    /// Target language examples of words the entry can be translated into and corresponding definitions
    tl_definitions: Vec<TargetLanguageDefinition>,
    /// Some definitions in the krdict dictionaries have one to three stars at the beginning of the definition
    /// indicating frequency. Three stars indicate the most frequent words.
    stars: u8,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct TargetLanguageDefinition {
    translation: String,
    definition: String,
}

impl KrDictEntry {
    pub fn sequence_number(&self) -> &i32 { &self.sequence_number }
    pub fn stars(&self) -> &u8 { &self.stars }
    pub fn headword(&self) -> &String { &self.headword }
}

type Headword = String;

#[derive(Clone)]
pub struct Dictionary {
    terms_map: HashMap<Headword, Vec<KrDictEntry>>,
    terms_vec: Vec<KrDictEntry>,
}

#[allow(dead_code)]
impl Dictionary {
    pub fn new(path: &str) -> Self {
        // TODO remove garbage entries like 24200
        let terms_vec: Vec<EntryJson> = serde_json::from_str(&read_to_string(path).unwrap()).unwrap();
        let terms_map = terms_vec
            .iter()
            .fold(HashMap::new(), |mut map: HashMap<Headword, Vec<KrDictEntry>>, term| {
                map.entry(term.headword.clone()).or_default().push(term.to_krdict_entry());
                map
            });
        Self {
            terms_map,
            terms_vec: terms_vec.iter().map(|term| term.to_krdict_entry()).collect(),
        }
    }

    pub fn get_terms(&self) -> Vec<&KrDictEntry> {
        self.terms_map.values().flatten().clone().collect()
    }

    pub fn search(&self, word: &str) -> Option<&Vec<KrDictEntry>> {
        self.terms_map.get(word)
    }

    pub fn search_with_deinflection_rules(&self, word: &str, deinflection_rules: Vec<String>) -> Option<Vec<KrDictEntry>> {
        self.terms_map.get(word)
            .map(|terms| {
                terms.clone().into_iter()
                    .filter(|term| {
                        if let Some(rule) = &term.deinflection_rule {
                            deinflection_rules.contains(rule)
                        } else {
                            false
                        }
                    })
                    .collect()
            })
    }

    pub fn get_by_sequence_number(&self, sequence_number: i32) -> Option<KrDictEntry> {
        if sequence_number == 0 || sequence_number > self.terms_vec.len() as i32 {
            return None
        }
        Some(self.terms_vec[sequence_number as usize - 1].clone())
    }
}



#[cfg(test)]
mod tests {

    #[test]
    fn entry_json_to_krdict_entry_1() {
        let definition = "개국하다 〔開國하다〕
1. かいこくする【開国する】
새로 나라가 세워지다. 또는 새로 나라를 세우다.
新たに国が建てられる。また、新たに国を建てる。
2. かいこくする【開国する】
다른 나라와 문화나 사상 등을 주고받다.
外国と文化や思想などの交流を行う。
".to_string();
        let entry_json = super::EntryJson {
            headword: "개국하다".to_string(),
            reading: "".to_string(),
            tags: "동사".to_string(),
            deinflection_rule: "".to_string(),
            frequency: 0,
            definitions: vec![definition.clone()],
            sequence_number: 0,
            tags2: "".to_string(),
        };

        let krdict_entry = entry_json.to_krdict_entry();

        assert_eq!(krdict_entry, super::KrDictEntry {
            headword: "개국하다".to_string(),
            reading: None,
            part_of_speech: "동사".to_string(),
            deinflection_rule: None,
            definition_full: definition.clone(),
            sequence_number: 0,
            hanja: Some("開國하다".to_string()),
            tl_definitions: vec![
                super::TargetLanguageDefinition {
                    translation: "かいこくする【開国する】".to_string(),
                    definition: "新たに国が建てられる。また、新たに国を建てる。".to_string(),
                },
                super::TargetLanguageDefinition {
                    translation: "かいこくする【開国する】".to_string(),
                    definition: "外国と文化や思想などの交流を行う。".to_string(),
                },
            ],
            stars: 0,
        });
    }

    #[test]
    fn entry_json_to_krdict_entry_2() {
        let definition = "★ 개국 〔個國〕
かこく【ヶ国】
나라를 세는 단위.
国を数える単位。
".to_string();
        let entry_json = super::EntryJson {
            headword: "개국하다".to_string(),
            reading: "".to_string(),
            tags: "동사".to_string(),
            deinflection_rule: "".to_string(),
            frequency: 0,
            definitions: vec![definition.clone()],
            sequence_number: 0,
            tags2: "".to_string(),
        };

        let krdict_entry = entry_json.to_krdict_entry();

        assert_eq!(krdict_entry, super::KrDictEntry {
            headword: "개국하다".to_string(),
            reading: None,
            part_of_speech: "동사".to_string(),
            deinflection_rule: None,
            definition_full: definition.clone(),
            sequence_number: 0,
            hanja: Some("個國".to_string()),
            tl_definitions: vec![
                super::TargetLanguageDefinition {
                    translation: "かこく【ヶ国】".to_string(),
                    definition: "国を数える単位。".to_string(),
                },
            ],
            stars: 1,
        });
    }
    
    // TODO test case for (対訳語無し)
}