# WIP
This project consists of two parts: a rust backend with a REST API and postgres database, and a browser extension written using the Plasmo framework and React.

![demo img](demo.png)

- Partial support for yomichan format of dictionaries (POC with KRDICT)
- Deinflection of verbs and adjectives using deinflection rules from [the Korean fork of yomichan](https://github.com/Lyroxide/yomichan-korean/blob/master/ext/data/deinflect.json)

## Features
- Hover Korean words while holding shift key to search for the word in Japanese KRDICT and display the result in a popup next to the word.
- Automatically underline Korean words on a website with colors according to status, both on pageload and for new text that is inserted. This is useful in combination with a texthooker page such as [this one](https://renji-xd.github.io/texthooker-ui/) to be able to use it with local videos or games
- Keep track of word status (unknown, seen, known) or ignored
- Easy sentence mining by exporting flash cards to [Anki](https://apps.ankiweb.net/)

## Development
Start up the backend along with the browser extension by following the description [here](backend/README.md#development) and [here](browser-extension/README.md#getting-started)

## TODO

- sorting improvements:
  - prefer longer matches over frequency (compare number of jamo that match)
  - needs sorting improvement: 떠날, 한심한, 남자, 비싼, 이름은, 다리
- deinflection improvements: 
  - 여길
  - more than one deinflected pass to catch compound grammar rules e.g. 잃었는데
- search improvements to remove noise: 야박하다 could exclude 야 if 3/4 match or something
- maybe try to incorporate grammar entries in krdict (headword contains loose jamo for some)
- mixed status (i.e a word matches several headwords where some are unknown, some are known, some are seen)
- ignore full words (not only per headword/dictionary match) (this probably requires new db table)

- allow looking up partial words by selecting text
- show name of deconjugations for inflected verbs and adjectives
- translate part-of-speech in the definition (currently it's in korean)
- proper styling and a decent design
- settings page/settings in popup.tsx
  - toggle monitoring (for underlining words)
  - change language (japanese, english etc.)
- possibly merge definitions where the only difference is part of speech (e.g 형식적 has definition for noun and for adjective but they are almost the same)
- show number of stars based on CC100 frequency
- structuring hanja/reading/Pos fields in the popup
- merge known/seen/unknown to one button
- show if the word has been added to anki already (maybe store this in db to be able to show it even without ankiconnect running?)

- doc for anki export
- motivation