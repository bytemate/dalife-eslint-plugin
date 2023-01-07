import { ESLintUtils } from '@typescript-eslint/experimental-utils';

// note - cannot migrate this to an import statement because it will make TSC copy the package.json to the dist folder
export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://code.byted.org/h_cloud/monorepo/tree/master/tools/eslint-plugin/rules/${name}/README.md`,
);
