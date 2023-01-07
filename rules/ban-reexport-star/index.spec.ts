import { rule } from '.';
import { test } from '../../utils';

// Valid
const validCode1 = `
export default function test() {};
export const a = 1;
export { b } from 'xxx1';
export { default as c } from 'xxx2'
`;

const validCode2 = `
export * as foo from 'xxx';
`;

// Invalid
const invalidCode = `
export * from 'xxx';
`;

describe('ban-reexport-star', () => {
  const ruleTester = test.getRuleTester();
  ruleTester.run('@dalife/ban-reexport-star', rule, {
    valid: [
      {
        code: validCode1,
      },
      {
        code: validCode2,
      },
    ],

    invalid: [
      {
        code: invalidCode,
        errors: [
          {
            messageId: 'BanReexportedStar',
          },
        ],
      },
    ],
  });
});
