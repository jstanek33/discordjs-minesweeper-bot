import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: ["**/.cache/**", "**/dist/**", "pnpm-lock.yaml"],
  printWidth: 120,
  singleQuote: false,
  semi: true,
  sortPackageJson: true,
  sortImports: {
    newlinesBetween: true,
    customGroups: [
      { groupName: "aliases", elementNamePattern: ["@/**", "~/**"] },
      { groupName: "srcimports", elementNamePattern: ["src/**"] },
    ],
    groups: [
      ["type-builtin", "value-builtin"],
      ["type-external", "value-external"],
      "aliases",
      "srcimports",
      ["type-subpath", "value-subpath"],
      ["type-parent", "value-parent"],
      ["type-sibling", "type-index", "value-sibling", "value-index"],
      "unknown",
    ],
  },
  trailingComma: "all",
});
