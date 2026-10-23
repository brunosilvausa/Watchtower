import defaultConfig from "./eslint.config.mjs";

const config = [
  ...defaultConfig,
  {
    files: ["apps/**/*.ts", "apps/**/*.tsx", "packages/**/*.ts", "design-system/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { project: "./tsconfig.eslint.json", tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
];

export default config;
