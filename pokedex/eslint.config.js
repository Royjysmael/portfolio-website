export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-var": "warn",
      semi: ["warn", "always"],
      quotes: ["warn", "double"],
    },
  },
];
