# WIP
## Features
- partial support for yomichan format of dictionaries (POC with KRDICT)
- deinflection of verbs and adjectives using deinflection rules from [the Korean fork of yomichan](https://github.com/Lyroxide/yomichan-korean/blob/master/ext/data/deinflect.json)

## Goals
TBD

## Development
Download dictionary from [here](https://github.com/Lyroxide/yomichan-korean#dictionaries) and extract it into `dictionaries/[KO-JA] KRDICT/`

`docker compose up` to run a local postgres instance for development

`sqlx migrate run` to run database migrations

`cargo watch -q -c -w src/ -x run` to automatically recompile on file changes and start a HTTP server on localhost:3000 (must be installed with cargo install cargo-watch)

alternatively you can use
`cargo run`

set environment variable `RUST_LOG=debug` to see debug logs

## API

### Lookup
`GET /lookup/:term`

Example response
```json
[
  {
    "dictEntry": {
      "headword": "최상위",
      "reading": null,
      "part_of_speech": "명사",
      "deinflection_rule": "n",
      "definition_full": "최상위 〔最上位〕\nさいじょうい【最上位】\n가장 높은 지위나 등급.\n最も高い地位や等級。\n",
      "sequence_number": 9504,
      "hanja": "最上位",
      "tl_definitions": [
        {
          "translation": "さいじょうい【最上位】",
          "definition": "最も高い地位や等級。"
        }
      ],
      "stars": 0
    },
    "status": {
      "id": 9504,
      "status": "known",
      "ignored": false,
      "tracked": false
    }
  }
]
```

### Word status
#### `GET /word_status/:id`

**Example response**
```json
{"id":123,"status":"unknown","ignored":false,"tracked":false}
```

---

#### `PATCH /word_status/:id`

**Example request body** (all fields are optional)
```json
{
  "ignored": true,
  "status": "seen",
  "tracked": false
}
```

**Example response**

`200 OK` if it updated an existing record

`200 CREATED` if it inserted a new record

### Analyze
#### `POST /analyze`
**Example request body**

`"그러니까 뭐라고 소개를 했냔 말입니다!"`

**Example response**
```json
{
  "그러니까": [
    {
      "id": 47399,
      "status": "known",
      "ignored": false,
      "tracked": false
    }
  ],
  "말입니다!": [
    {
      "id": 38157,
      "status": "seen",
      "ignored": false,
      "tracked": false
    }
  ],
  "했냔": []
}
```

Words without status are not included in the response, so in this example 소개를 is found but has default status.
Words not found in the dictionary have an empty array of statuses (no ID).