use serde::Deserialize;
use std::collections::HashMap;
use std::fs::read_to_string;

#[derive(Debug, Deserialize)]
struct Item {
    #[serde(rename = "0")]
    word: String,
    #[serde(skip_serializing, rename = "1")]
    #[allow(dead_code)]
    frequency_type: String,
    #[serde(skip_serializing, rename = "2")]
    frequency_data: FrequencyValues,
}

#[derive(Debug, Deserialize)]
struct FrequencyValues {
    value: u32,
    #[serde(skip_serializing)]
    displayValue: String,
}

pub struct FrequencyDictionary(HashMap<String, u32>);

impl FrequencyDictionary {
    pub fn new() -> Self {
        Self(read_freq_dict_to_map())
    }

    pub fn lookup(&self, word: &str) -> Option<u32> {
        self.0.get(word).copied()
    }
}

fn read_freq_dict_to_map() -> HashMap<String, u32> {
    let result: Vec<Item> = serde_json::from_str(
        &read_to_string("dictionaries/[Frequency] CC100 (Korean)/term_meta_bank_1.json")
            .expect("Could not find frequency dictionary file. See README.md"),
    )
    .expect("Failed to parse JSON for frequency dictionary");

    result.iter().fold(HashMap::new(), |mut map, item| {
        map.insert(item.word.clone(), item.frequency_data.value);
        map
    })
}
