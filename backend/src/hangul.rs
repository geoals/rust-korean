// TODO change arrays to a maps and benchmark difference
const INITIAL_JAMO: [char; 19] = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ',
    'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ',
    'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ',
    'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ',
    'ㅌ', 'ㅍ', 'ㅎ',
];

const VOWEL_JAMO: [char; 21] = [
    'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ',
    'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ',
    'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ',
    'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ',
    'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ',
    'ㅣ',
];

const FINAL_JAMO: [Option<char>; 28] = [
    None, Some('ㄱ'), Some('ㄲ'), Some('ㄳ'),
    Some('ㄴ'), Some('ㄵ'), Some('ㄶ'), Some('ㄷ'),
    Some('ㄹ'), Some('ㄺ'), Some('ㄻ'), Some('ㄼ'),
    Some('ㄽ'), Some('ㄾ'), Some('ㄿ'), Some('ㅀ'),
    Some('ㅁ'), Some('ㅂ'), Some('ㅄ'), Some('ㅅ'),
    Some('ㅆ'), Some('ㅇ'), Some('ㅈ'), Some('ㅊ'),
    Some('ㅋ'), Some('ㅌ'), Some('ㅍ'), Some('ㅎ'),
];

const GA_LOCATION: u32 = '가' as u32; // = 44_032

/// This is required because of how yomichan decomposes vowels, to support the format in deinflect.json
fn disassemble_vowel_jamo(c: &char) -> Vec<char> {
    match c {
        'ㅘ' => vec!['ㅗ', 'ㅏ'],
        'ㅙ' => vec!['ㅗ', 'ㅐ'],
        'ㅚ' => vec!['ㅗ', 'ㅣ'],
        'ㅝ' => vec!['ㅜ', 'ㅓ'],
        'ㅞ' => vec!['ㅜ', 'ㅔ'],
        'ㅟ' => vec!['ㅜ', 'ㅣ'],
        'ㅢ' => vec!['ㅡ', 'ㅣ'],
        _ => vec![*c]
    }
}

/// This is required because of how yomichan decomposes vowels, to support the format in deinflect.json
fn assemble_vowel_jamo(first: char, second: char) -> Option<char> {
    match (first, second) {
        ('ㅗ', 'ㅏ') => Some('ㅘ'),
        ('ㅗ', 'ㅐ') => Some('ㅙ'),
        ('ㅗ', 'ㅣ') => Some('ㅚ'),
        ('ㅜ', 'ㅓ') => Some('ㅝ'),
        ('ㅜ', 'ㅔ') => Some('ㅞ'),
        ('ㅜ', 'ㅣ') => Some('ㅟ'),
        ('ㅡ', 'ㅣ') => Some('ㅢ'),
        _ => None
    }
}

/// Expects input characters to be [compatability jamo](https://en.wikipedia.org/wiki/Hangul_Compatibility_Jamo) from U+3131 to U+3163
fn from_jamo(initial: char, medial: char, last: Option<char>) -> Option<char> {
    char::from_u32(
        GA_LOCATION
            + 588 * (INITIAL_JAMO.iter().position(|&c| c == initial)? as u32)
            + 28 * (VOWEL_JAMO.iter().position(|&c| c == medial)? as u32)
            + FINAL_JAMO.iter().position(|&c| c == last)? as u32
    )
}

fn to_jamo(ch: char) -> Vec<char> {
    if !(GA_LOCATION..GA_LOCATION+11171).contains(&(ch as u32)) {
        return vec![ch];
    }

    let index = ch as u32 - GA_LOCATION;
    let initial_index = (index / 588) as usize;
    let medial_index = ((index % 588) / 28) as usize;
    let final_index = (index % 28) as usize;

    let mut result = vec![
        INITIAL_JAMO[initial_index],
        VOWEL_JAMO[medial_index],
    ];
    let final_char = FINAL_JAMO[final_index];
    if let Some(final_char) = final_char {
        result.push(final_char);
    }
    result.iter().flat_map(disassemble_vowel_jamo).collect()
}

pub fn is_hangul(c: char) -> bool {
    (0xAC00..0xD7AF).contains(&(c as i32))
}

pub trait HangulExt {
    fn to_jamo(&self) -> String;
    fn to_hangul(&self) -> String;
}

impl HangulExt for &str {
    fn to_jamo(&self) -> String {
        self.chars().flat_map(to_jamo).collect()
    }

    fn to_hangul(&self) -> String {
        self.to_string().to_hangul()
    }
}

impl HangulExt for String {
    fn to_jamo(&self) -> String {
        self.chars().flat_map(to_jamo).collect()
    }

    // TODO this might need refactoring and optimization
    // TODO return Result or Option instead?
    fn to_hangul(&self) -> String {
        let mut result = String::new();
        let mut iter = self.chars();

        while let Some(initial) = iter.next() {
            if !INITIAL_JAMO.contains(&initial) {
                result.push(initial);
                continue;
            }

            if let Some(medial) = iter.next() {
                if !VOWEL_JAMO.contains(&medial) {
                    result.push(initial);
                    result.push(medial);
                    continue;
                }

                // if the fourth char is a vowel, compose the first two
                if VOWEL_JAMO.contains(&iter.clone().nth(1).unwrap_or(' ')) {
                    result.push(from_jamo(initial, medial, None).unwrap());
                    continue;
                }

                if let Some(last) = iter.next() {
                    // if there are two vowels in a row, reassemble them first
                    // TODO replace this if block with just reassmeble the two vowels and then going to next iteration
                    if VOWEL_JAMO.contains(&medial) && VOWEL_JAMO.contains(&last) {
                        let assembled_middle = assemble_vowel_jamo(medial, last);
                        if assembled_middle.is_none() {
                            result.extend([initial, medial, last]);
                            continue;
                        }
                        let assembled_middle = assembled_middle.unwrap();
                        let next = iter.clone().next().unwrap_or(' '); // TODO replace with peekable

                        // if the fourth char is a vowel, compose the first two
                        if VOWEL_JAMO.contains(&iter.clone().nth(1).unwrap_or(' ')) {
                            result.push(from_jamo(initial, assembled_middle, None).unwrap());
                            continue;
                        }

                        if FINAL_JAMO.contains(&Some(next)) {
                            iter.next();
                            result.push(from_jamo(initial, assembled_middle, Some(next)).unwrap());
                        } else  {
                            result.push(from_jamo(initial, assembled_middle, None).unwrap());
                        }
                        continue;
                    }

                    if !FINAL_JAMO.contains(&Some(last)) {
                        result.push(from_jamo(initial, medial, None).unwrap());
                        result.push(last);
                        continue;
                    }
                    result.push(from_jamo(initial, medial, Some(last)).unwrap());
                }
                else {
                    result.push(from_jamo(initial, medial, None).unwrap());
                }
            }
        }

        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compose() {
        assert_eq!(Some('먹'), from_jamo('ㅁ', 'ㅓ', Some('ㄱ')));
    }

    #[test]
    fn test_decompose() {
        assert_eq!(vec!['ㅁ', 'ㅓ', 'ㄱ'], to_jamo('먹'));
        assert_eq!(vec!['ㅇ', 'ㅣ', 'ㄺ'], to_jamo('읽'));
        assert_eq!(vec!['ㄱ', 'ㅔ', 'ㅆ'], to_jamo('겠'));
    }

    #[test]
    fn test_as_jamo() {
        assert_eq!("ㅁㅓㄱㅇㅓㅇㅛ", "먹어요".to_string().to_jamo());
        assert_eq!("ㄷㅐㅎㅏㄴㅁㅣㄴㄱㅜㄱㅇㅡㅣ", "대한민국의".to_string().to_jamo());
        assert_eq!("ㅁㅜㄴㅈㅏㅊㅔㄱㅖㄹㅗ", "문자체계로".to_string().to_jamo());
        assert_eq!("ㅎㅗㅏㄱㅇㅣㄴㅎㅏㄹ", "확인할".to_string().to_jamo());
        assert_eq!("구성되어".to_string().to_jamo(), "ㄱㅜㅅㅓㅇㄷㅗㅣㅇㅓ");
    }

    #[test]
    fn test_to_hangul() {
        assert_eq!("먹어요", "ㅁㅓㄱㅇㅓㅇㅛ".to_string().to_hangul());
        assert_eq!("대한민국의", "ㄷㅐㅎㅏㄴㅁㅣㄴㄱㅜㄱㅇㅡㅣ".to_string().to_hangul());
        assert_eq!("문자체계로, ", "ㅁㅜㄴㅈㅏㅊㅔㄱㅖㄹㅗ, ".to_string().to_hangul());
        assert_eq!("확인할", "ㅎㅗㅏㄱㅇㅣㄴㅎㅏㄹ".to_string().to_hangul());
        assert_eq!("ㄱㅜㅅㅓㅇㄷㅗㅣㅇㅓ".to_string().to_hangul(), "구성되어");
    }

    #[test]
    fn test_decompose_and_recompose_parapraph() {
        let paragraph = "한글은 대한민국의 공식 문자체계로, 모든 언어의 체계와 마찬가지로 자음과 모음으로 구성되어 있습니다. 한글은 자음과 모음이 모두 조합되어 음절을 이루는 특징이 있어서, 초성, 중성, 종성의 세 가지 요소로 나뉘어지며, 이를 통해 다양한 음운을 표현할 수 있습니다. 또한, 쌍자음이나 이중모음과 같은 특수한 경우도 고려해야 합니다. 예를 들어 '먹어요'라는 단어는 초성 'ㅁ', 중성 'ㅓ', 종성 'ㅇ', 초성 'ㅇ', 중성 'ㅓ', 종성 'ㅇ', 종성 'ㅛ'으로 구성되어 있습니다. 이러한 다양한 조합을 테스트하여 한글 처리 함수가 올바르게 동작하는지 확인할 수 있습니다. 다";

        let disassembled = paragraph.to_jamo();
        assert_eq!(disassembled.to_hangul(), paragraph);
    }
}
