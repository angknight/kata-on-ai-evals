import { writeFile } from "node:fs/promises";
import { generateBanner } from "./generateBanner";

// Asks Claude Code to implement the Banner and saves it as src/Banner.jsx.
const source = await generateBanner();
await writeFile(new URL("./Banner.jsx", import.meta.url), source);
console.log("Claude wrote src/Banner.jsx. Next: npm test, then npm run preview.");
