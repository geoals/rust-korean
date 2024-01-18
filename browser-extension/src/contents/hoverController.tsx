import styleText from "data-text:./hoverController/style.module.css"
import { HoverController } from "./hoverController/HoverController";

export default HoverController;
 
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}