import styleText from "data-text:../style.css";
import { DictionaryPopup } from "./dictionaryPopup/DictionaryPopup";
import type { PlasmoCSConfig } from "plasmo";

export default DictionaryPopup;

export const getStyle = () => {
  const style = document.createElement("style");
  style.textContent = styleText;
  return style;
};

export const config: PlasmoCSConfig = {
  css: ["font.css"],
};
