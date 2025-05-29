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

  {
    rules: {
      // Disable unused vars
      "@typescript-eslint/no-unused-vars": "off",

      // Disable explicit 'any' errors
      "@typescript-eslint/no-explicit-any": "off",

      // Disable warnings about unescaped entities in JSX
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
