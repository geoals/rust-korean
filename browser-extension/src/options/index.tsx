import { useStorage } from "@plasmohq/storage/hook"

export default function Options() {

  const japanese = 'japanese'
  const english = 'english'
  const [language, setLanguage] = useStorage<'japanese'|'english'>("language", (v) => v === undefined ? japanese : v)

  return (
    <>
      <input
        type="radio"
        id={japanese}
        value={japanese}
        checked={language === japanese}
        onChange={() => setLanguage(japanese)}
      />
      <label htmlFor={japanese}>日本語</label>
      <input
        type="radio"
        id={english}
        value={english}
        checked={language === english}
        onChange={() => setLanguage(english)}
      />
      <label htmlFor={english}>English</label>
    </>
  );
}
