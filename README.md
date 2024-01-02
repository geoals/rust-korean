# WIP
## Features
- partial support for yomichan format of dictionaries (POC with KRDICT)
- deinflection of verbs and adjectives using deinflection rules from [the Korean fork of yomichan](https://github.com/Lyroxide/yomichan-korean/blob/master/ext/data/deinflect.json)

## Goals
TBD

## Usage
Download dictionary from [here](https://github.com/Lyroxide/yomichan-korean#dictionaries) and extract it into `dictionaries/[KO-JA] KRDICT/`

`cargo run` to start a HTTP server on localhost:3000

`RUST_LOG=debug cargo run` to see debug logs

`curl localhost:3000/lookup/{term}` to lookup definition for Korean word {term}