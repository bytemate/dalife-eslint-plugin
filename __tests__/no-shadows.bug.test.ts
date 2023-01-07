import { RuleTester } from 'eslint';
import { defaultESLintOptions } from '../utils/constants';

describe.skip('no-shadows bug inspect', () => {
  const ruleTester = new RuleTester(defaultESLintOptions);
  ruleTester.run(
    'no-shadows bug inspect',
    require('eslint/lib/rules/no-shadow.js'),
    {
      invalid: [
        {
          errors: [{}],
          code: `enum LoadingName {
            FetchCard = 'fetchCard',
            FetchHistogram = 'FetchHistogram',
            DeleteCard = 'deleteCard',
          }
          
          console.log(LoadingName);
              `,
        },
      ],
      valid: [
        {
          code: `enum LoadingName {
            FetchCard = 'fetchCard',
            FetchHistogram = 'FetchHistogram',
            DeleteCard = 'deleteCard',
          }
          
          console.log(LoadingName);
        `,
        },
      ],
    },
  );
});
