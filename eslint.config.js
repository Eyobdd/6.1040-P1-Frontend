import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    // Global ignores
    ignores: ['dist', 'node_modules', '.eslintrc.cjs'],
  },
  // TypeScript Configuration
  ...tseslint.configs.recommended,
  // Vue 3 Configuration
  ...pluginVue.configs['flat/recommended'],
  // Prettier Configuration
  eslintPluginPrettierRecommended,
  {
    // Custom rules and settings
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  {
    // Specific overrides for Vue files
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        sourceType: 'module',
      },
    },
  },
];
