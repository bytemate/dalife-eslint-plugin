import { rule } from '../';
import { test } from '../../../utils';
import { options } from './options';

describe('import-type', () => {
  const ruleTester = test.getRuleTester();
  ruleTester.run('@dalife/import-type', rule, {
    valid: [],
    invalid: [
      {
        options,
        // fix defaultImport
        code: `
          import activityModel, { FetchActivityListParams } from '@/models/activity';
          const queryParams: FetchActivityListParams;
        `,
        output: `
          import activityModel, { type FetchActivityListParams } from '@/models/activity';
          const queryParams: FetchActivityListParams;
        `,
        errors: [{ messageId: 'importsUsedAsType' }],
      },
    ],
  });
});
