export const defaultESLintOptions = Object.freeze({
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 11, // ES2020
    ecmaFeatures: {
      jsx: true,
      useJSXTextNode: true,
    },
  } as const,
  parser: require.resolve('@typescript-eslint/parser'),
});
