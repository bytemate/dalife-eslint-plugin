import { ESLintUtils } from '@typescript-eslint/experimental-utils';
import { defaultESLintOptions } from './constants';

export function getRuleTester(options: any = {}) {
  return new ESLintUtils.RuleTester({
    ...defaultESLintOptions,
    ...options,
  });
}
