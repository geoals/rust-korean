import styleText from "data-text:../style.css"
import { DictionaryPopup } from "./dictionaryPopup/DictionaryPopup";

export default DictionaryPopup;

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}