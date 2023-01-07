import { test } from '../../utils';
import { rule } from '.';

describe('@dalife/no-deprecated-type-React.FC', () => {
  const ruleTester = test.getRuleTester();
  ruleTester.run('@dalife/no-deprecated-type-React.FC', rule, {
    valid: [
      {
        code: `
          const A = () => <div />
        `
      },
    ],
    invalid: [
      {
        code: `
          import type { FC } from 'react';

          const A: FC = () => <div />
        `,
        output: `
          

          const A = () => <div />
        `,
        errors: [
          {
            messageId: 'deprecatedFC',
            line: 2
          },
          {
            messageId: 'deprecatedFC',
            line: 4
          }
        ],
      },
      {
        code: `
          import React from 'react';

          interface AProps {
            className?: string;
          }

          const A: React.FC<AProps> = (props) => <div {...props} />;
        `,
        output: `
          import React from 'react';

          interface AProps {
            className?: string;
          }

          const A = (props: AProps) => <div {...props} />;
        `,
        errors: [
          {
            messageId: 'deprecatedFC',
          },
        ],
      },
      {
        code: `
          import React from 'react';

          interface AProps {
            className?: string;
          }

          const A: React.FC<AProps> = function({ className }) { return <div className={className} /> };
        `,
        output: `
          import React from 'react';

          interface AProps {
            className?: string;
          }

          const A = function({ className }: AProps) { return <div className={className} /> };
        `,
        errors: [
          {
            messageId: 'deprecatedFC',
          },
        ],
      },
      {
        code: `
          import React from 'react';

          const A: React.FC<{
            className?: string;
            id: string;
          }> = ({ className }) => <div className={className} />;
        `,
        output: `
          import React from 'react';

          const A = ({ className }: {
            className?: string;
            id: string;
          }) => <div className={className} />;
        `,
        errors: [
          {
            messageId: 'deprecatedFC',
          },
        ],
      }
    ],
  });
});
