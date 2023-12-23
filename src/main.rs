use crate::dictionary::{Dictionary, KrDictEntry};
use crate::search::get;

mod deinflect;
mod hangul;
mod dictionary;
mod search;

fn main() {
    let first_cli_arg = std::env::args().nth(1).unwrap_or("".to_string());

    let dictionary = Dictionary::new("dictionaries/[KO-JA] KRDICT/term_bank_1.json");

    let matches = get(&first_cli_arg, &dictionary);
    for term in matches {
        for def in term.definitions() {
            println!("{}", def);
            println!("{} stars", term.krdict_stars())
        }
    }
}

