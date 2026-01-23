module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  settings: {
    react: {
      version: "detect"
    }
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/consistent-type-imports": ["warn", { "prefer": "type-imports" }]
  },
  overrides: [
    {
      files: ["**/metro.config.js", "**/babel.config.js", "**/*.config.js"],
      rules: {
        "@typescript-eslint/no-var-requires": "off"
      }
    }
  ],
  ignorePatterns: ["dist", "build", ".expo", "coverage", "node_modules"]
};
