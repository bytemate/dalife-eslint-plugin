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
        import type { Rule as Rule2 } from 'eslint';
        const rule: Rule2.RuleModule = {};
        `,
      },
    ],
    invalid: [
      {
        options,
        code: `
          import { Button } from 'antd';
          import { ButtonProps, value } from 'antd/lib/button';
          export default function LinkBtn(props: ButtonProps) {
            console.log(value);
            return <Button {...props} type="link" />;
          }
        `,
        output: `
          import { Button } from 'antd';
          import { value } from 'antd/lib/button';
          import type { ButtonProps } from 'antd/lib/button';
          export default function LinkBtn(props: ButtonProps) {
            console.log(value);
            return <Button {...props} type="link" />;
          }
        `,
        errors: [{ messageId: 'importsUsedAsType' }],
      },
    ],
  });
});
