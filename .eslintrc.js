module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:promise/recommended',
    'plugin:prettier/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'prettier', 'promise', 'import'],
  ignorePatterns: ['**/prisma/generated/type-graphql'],
  rules: {
    'prettier/prettier': ['error', { endOfLine: 'auto', trailingComma: 'none' }],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-interface': [
      'error',
      {
        allowSingleExtends: true
      }
    ],
    'prefer-const': ['error', { ignoreReadBeforeAssign: true }],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: ['*'], next: ['*'] },
      { blankLine: 'always', prev: ['import', 'export'], next: ['*'] },
      { blankLine: 'any', prev: ['export'], next: ['export', 'empty'] },
      { blankLine: 'always', prev: 'directive', next: '*' },
      { blankLine: 'any', prev: 'directive', next: 'directive' }
    ],
    'promise/always-return': 'off'
    // 'import/order': [
    //   'error',
    //   {
    //     'newlines-between': 'always',
    //     // groups: [
    //     //   ['builtin', 'external'],
    //     //   ['internal', 'parent', 'sibling', 'index'],
    //     // ],
    //     pathGroups: [
    //       {
    //         pattern: '@src/**',
    //         group: 'external',
    //         position: 'after',
    //       },
    //     ],
    //     alphabetize: {
    //       order: 'asc',
    //       caseInsensitive: true,
    //     },
    //     warnOnUnassignedImports: true,
    //   },
    // ],
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  }
}
