import { RuleTester } from 'eslint';
import { defaultESLintOptions } from '../utils/constants';

describe.skip('jsx-handler-names bug inspect', () => {
  const ruleTester = new RuleTester(defaultESLintOptions);
  ruleTester.run(
    'jsx-handler-name bug inspect',
    require('eslint-plugin-react/lib/rules/jsx-handler-names.js'),
    {
      invalid: [
        {
          errors: [{}],
          code: `
      const C = (_, row) => {
        return (
          <div>
            <Button
              type="text"
              onClick={() => history.push("xxxx")}
            >
              编辑
            </Button>
            <Button type="text" onClick={() => delIntent(row.intentId)}>
              删除
            </Button>
          </div>
        );
      };
              `,
        },
      ],
      valid: [
        {
          code: `
const C = (_, row) => {
  return (
    <div>
      <Button
        type="text"
        onClick={() => history.push("xxxx")}
      >
        编辑
      </Button>
      <Button type="text" onClick={() => delIntent(row.intentId)}>
        删除
      </Button>
    </div>
  );
};
        `,
        },
      ],
    },
  );
});
