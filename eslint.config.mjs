import {defineConfig} from '@eslint/config-helpers';
import js from '@eslint/js';
import json from '@eslint/json';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint, {parser} from 'typescript-eslint';

export default defineConfig(
  {
    files: ['**/*.ts', 'eslint.config.mjs'],
    extends: [
      js.configs.recommended,
      prettierRecommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs'],
        },
      },
    },
  },
  {
    files: ['**/*.json'],
    ignores: ['package-lock.json', '.vscode/**'],
    language: 'json/json',
    ...json.configs.recommended,
  }
);
