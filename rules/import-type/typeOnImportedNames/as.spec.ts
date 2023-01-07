import { rule } from '../';
import { test } from '../../../utils';
import { options } from './options';

describe('import-type', () => {
  const ruleTester = test.getRuleTester();
  ruleTester.run('@dalife/import-type', rule, {
    valid: [
      {
        options,
        code: `
        import { type Rule as Rule2 } from 'eslint';
        const rule: Rule2.RuleModule = {};
        `,
      },
    ],
    invalid: [
      {
        options,
        code: `
          import { Rule as Rule2 } from 'eslint';
          const rule: Rule2.RuleModule = {};
        `,
        output: `
          import { type Rule as Rule2 } from 'eslint';
          const rule: Rule2.RuleModule = {};
        `,
        errors: [{ messageId: 'importsUsedAsType' }],
      },
    ],
  });
});
