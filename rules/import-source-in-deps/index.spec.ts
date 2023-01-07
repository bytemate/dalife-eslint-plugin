import { test } from '../../utils';
import { rule } from '.';

describe('import-source-in-deps', () => {
  const ruleTester = test.getRuleTester();
  ruleTester.run('import-source-in-deps', rule, {
    valid: [
      {
        code: `import 'eslint';`,
        filename: __filename,
      },
    ],
    invalid: [
      {
        code: `import { useState } from 'react'`,
        filename: __filename,
        errors: [
          {
            messageId: 'noDeps',
          },
        ],
      },
    ],
  });
});
