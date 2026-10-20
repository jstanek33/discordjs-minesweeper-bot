import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["import", "oxc", "typescript", "unicorn"],
  categories: {
    correctness: "error",
    suspicious: "warn",
    perf: "warn",
  },
  ignorePatterns: ["**/.cache/**", "**/dist/**"],
  options: {
    denyWarnings: true,
    // false positives without type aware linting enabled, pre-push only
    // reportUnusedDisableDirectives: "error",
    respectEslintDisableDirectives: true,
    typeAware: false,
    typeCheck: false,
  },
  rules: {
    "array-callback-return": "error",
    "func-style": ["error", "declaration"],
    "prefer-arrow-callback": "error",
    "sort-imports": [
      "error",
      {
        ignoreDeclarationSort: true, // oxfmt
        ignoreMemberSort: false,
      },
    ],

    "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
    "import/no-cycle": ["error", { maxDepth: 3 }],
    "import/no-duplicates": "error",
    "import/no-unassigned-import": "off", // css

    "no-underscore-dangle": ["error", { allow: [/* */] }],
    "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "no-restricted-properties": [
      "error",
      {
        object: "process",
        property: "env",
        message: "Use `import { env } from '#env'` for validated types.",
      },
    ],
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "process",
            importNames: ["env"],
            message: "Use `import { env } from '#env'`.",
          },
        ],
      },
    ],

    "oxc/approx-constant": "error",
    "oxc/bad-bitwise-operator": "error",
    "oxc/branches-sharing-code": "error",

    "typescript/adjacent-overload-signatures": "error",
    "typescript/array-type": "error",
    "typescript/ban-ts-comment": [
      "error",
      {
        "ts-expect-error": "allow-with-description",
        "ts-ignore": true,
        "ts-nocheck": true,
        "ts-check": false,
        minimumDescriptionLength: 3,
      },
    ],
    "typescript/ban-tslint-comment": "error",
    "typescript/class-literal-property-style": "error",
    "typescript/consistent-return": "off",
    "typescript/consistent-type-definitions": ["error", "interface"],
    "typescript/consistent-type-imports": ["warn", { prefer: "type-imports", fixStyle: "separate-type-imports" }],
    "typescript/explicit-member-accessibility": "error",
    "typescript/explicit-function-return-type": "error",
    // https://github.com/oxc-project/oxc/issues/2180
    // "typescript/naming-convention": ["error", { format: ["UPPER_CASE"], selector: "enumMember" }],
    // "typescript/no-base-to-string": "error",
    "typescript/no-floating-promises": ["error", { ignoreVoid: true }],
    "typescript/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
    "typescript/prefer-literal-enum-member": ["error", { allowBitwiseExpressions: true }],
    "typescript/switch-exhaustiveness-check": "error",

    "unicorn/catch-error-name": ["error", { name: "err" }],
    "unicorn/consistent-date-clone": "error",
    "unicorn/consistent-empty-array-spread": "error",
    "unicorn/consistent-existence-index-check": "error",
    "unicorn/prefer-node-protocol": "error",
    "unicorn/filename-case": ["error", { case: "kebabCase" }],
  },
  overrides: [
    {
      files: ["**/env*.ts"],
      rules: {
        "no-restricted-properties": "off",
        "no-restricted-imports": "off",
      },
    },
  ],
});
