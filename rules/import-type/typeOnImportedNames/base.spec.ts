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
        import { type Rule } from 'eslint';
        const rule: Rule.RuleModule = {};
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
          import { value, type ButtonProps } from 'antd/lib/button';
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
