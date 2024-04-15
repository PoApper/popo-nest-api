module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  settings: {},
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    "prettier/prettier": ["error", { "endOfLine": "auto" }],
  },
};
