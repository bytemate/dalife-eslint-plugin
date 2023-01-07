import { rule } from '.';
import { test } from '../../utils';

describe('react-v17', () => {
  const ruleTester = test.getRuleTester();
  ruleTester.run('@dalife/react-v17', rule, {
    valid: [
      {
        filename: 'index.tsx',
        code: `
          import React from 'react';
          export { React };
        `,
      },
      {
        filename: 'index.ts',
        code: `
          import React from 'react';
          export const { memo } = React;;
        `,
      },
      {
        filename: 'index.tsx',
        code: `
        import * as React from 'react';
        export const Context = React.createContext();
        `,
      },
    ],
    invalid: [
      {
        filename: 'index.tsx',
        code: `
import React from 'react';
export default <h1>Hello</h1>;
        `,
        output: `
export default <h1>Hello</h1>;
        `,
        errors: [{ messageId: 'default' }],
      },
      {
        filename: 'index.tsx',
        code: `
import * as React from 'react';
export default <h1>Hello</h1>;
        `,
        output: `
export default <h1>Hello</h1>;
        `,
        errors: [{ messageId: 'default' }],
      },
      {
        filename: 'index.tsx',
        code: `
import React, { useEffect } from 'react';
export default <h1>Hello</h1>;
        `,
        output: `
import { useEffect } from 'react';
export default <h1>Hello</h1>;
        `,
        errors: [{ messageId: 'default' }],
      },
    ],
  });
});
