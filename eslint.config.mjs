import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...compat.extends("next/core-web-vitals", "next/dynamic"),
  ...compat.extends("next/core-web-vitals", "next/link"),
  ...compat.extends("next/core-web-vitals", "next/image"),
  ...compat.extends("next/core-web-vitals", "next/font"),
  {rules:{
    "@typescript-eslint/no-explicit-any": "off",
  }}
];





export default eslintConfig;
