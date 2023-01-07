import { test } from '../../utils';
import { rule } from '.';

describe('@dalife/react-prefer-named-imports', () => {
  const ruleTester = test.getRuleTester();
  ruleTester.run('@dalife/react-prefer-named-imports', rule, {
    valid: [
      {
        code: `
          import { useState } from 'react';
          const A = () => {
            const [a, setA] = useState(0);
            return <div>{a}</div>
          }
        `
      },
    ],
    invalid: [
      {
        code: `
          import React from 'react';
          const A = React.memo(() => {
            const [a, setA] = React.useState(0);
            return <div>{a}</div>
          })
        `,
        output: `
          import { memo, useState } from 'react';
          const A = memo(() => {
            const [a, setA] = useState(0);
            return <div>{a}</div>
          })
        `,
        errors: [
          {
            messageId: 'preferNamedImports',
            line: 2,
          },
          {
            messageId: 'preferNamedImports',
            line: 3,
          },
          {
            messageId: 'preferNamedImports',
            line: 4
          },
        ]
      },
      {
        code: `
          import React from 'react';
          const memo = 1;
          console.log(memo);
          const A = React.memo(() => {
            const [a, setA] = React.useState(0);
            return <div>{a}</div>
          })
        `,
        output: `
          import React, { useState } from 'react';
          const memo = 1;
          console.log(memo);
          const A = React.memo(() => {
            const [a, setA] = useState(0);
            return <div>{a}</div>
          })
        `,
        errors: [
          {
            messageId: 'preferNamedImports',
            line: 2,
          },
          {
            messageId: 'preferNamedImports',
            line: 5,
          },
          {
            messageId: 'preferNamedImports',
            line: 6
          },
        ]
      },
      {
        code: `
          import React from 'react';
          interface A {
            a: React.ReactNode;
          }
        `,
        output: `
          import type { ReactNode } from 'react';
          interface A {
            a: ReactNode;
          }
        `,
        errors: [
          {
            messageId: 'preferNamedImports',
            line: 2,
          },
          {
            messageId: 'preferNamedImports',
            line: 4
          }
        ]
      },
      {
        code: `
          import React from 'react';
          const ReactNode = 1;
          console.log(ReactNode);
          interface A {
            a: React.ReactNode;
          }
          const B = () => {
            const [b] = React.useState(0);
            const [c] = React.useState(0);
            return <div>{b}{c}</div>
          }
        `,
        output: `
          import React, { useState } from 'react';
          const ReactNode = 1;
          console.log(ReactNode);
          interface A {
            a: React.ReactNode;
          }
          const B = () => {
            const [b] = useState(0);
            const [c] = useState(0);
            return <div>{b}{c}</div>
          }
        `,
        errors: [
          {
            messageId: 'preferNamedImports',
            line: 2,
          },
          {
            messageId: 'preferNamedImports',
            line: 6
          },
          {
            messageId: 'preferNamedImports',
            line: 9
          },
          {
            messageId: 'preferNamedImports',
            line: 10
          }
        ]
      },
      {
        code: `
import React from 'react';
const useState = 1;
console.log(useState);
interface A {
  a: React.ReactNode;
}
const B = () => {
  const [b, setB] = React.useState(0);
  return <div>{b}</div>
}
        `,
        output: `
import React from 'react';
import type { ReactNode } from 'react';
const useState = 1;
console.log(useState);
interface A {
  a: ReactNode;
}
const B = () => {
  const [b, setB] = React.useState(0);
  return <div>{b}</div>
}
        `,
        errors: [
          {
            messageId: 'preferNamedImports',
            line: 2,
          },
          {
            messageId: 'preferNamedImports',
            line: 6
          },
          {
            messageId: 'preferNamedImports',
            line: 9
          }
        ]
      },
      {
        code: `
          import React, { memo } from 'react';
          const A = memo(() => {
            const [a, setA] = React.useState(0);
            return <div>{a}</div>
          })
        `,
        output: `
          import { memo, useState } from 'react';
          const A = memo(() => {
            const [a, setA] = useState(0);
            return <div>{a}</div>
          })
        `,
        errors: [
          {
            messageId: 'preferNamedImports',
            line: 2,
          },
          {
            messageId: 'preferNamedImports',
            line: 4
          }
        ]
      },
      {
        code: `
          import React from 'react';
          import type { ReactNode } from 'react'
          export interface AProps {
            a: ReactNode;
          }
          const A = React.memo(() => {
            const [a, setA] = React.useState(0);
            return <div>{a}</div>
          })
        `,
        output: `
          import { memo, useState } from 'react';
          import type { ReactNode } from 'react'
          export interface AProps {
            a: ReactNode;
          }
          const A = memo(() => {
            const [a, setA] = useState(0);
            return <div>{a}</div>
          })
        `,
        errors: [
          {
            messageId: 'preferNamedImports',
            line: 2,
          },
          {
            messageId: 'preferNamedImports',
            line: 7
          },
          {
            messageId: 'preferNamedImports',
            line: 8
          }
        ]
      },
      {
        code: `
          import React, { memo } from 'react';
          import type { ReactNode } from 'react'
          export interface AProps {
            a: ReactNode;
          }
          const A = memo(() => {
            const [a, setA] = React.useState(0);
            return <div>{a}</div>
          })
        `,
        output: `
          import { memo, useState } from 'react';
          import type { ReactNode } from 'react'
          export interface AProps {
            a: ReactNode;
          }
          const A = memo(() => {
            const [a, setA] = useState(0);
            return <div>{a}</div>
          })
        `,
        errors: [
          {
            messageId: 'preferNamedImports',
            line: 2,
          },
          {
            messageId: 'preferNamedImports',
            line: 8
          }
        ]
      },
      {
        code: `
import React from 'react';

interface AProps {
  a?: React.ReactNode;
}

const A = ({ a }: AProps) => {
  const [b] = React.useState(0);
  return <div>{a}{b}</div>
}
        `,
        output: `
import { useState } from 'react';
import type { ReactNode } from 'react';

interface AProps {
  a?: ReactNode;
}

const A = ({ a }: AProps) => {
  const [b] = useState(0);
  return <div>{a}{b}</div>
}
        `,
        errors: [
          {
            messageId: 'preferNamedImports',
            line: 2,
          },
          {
            messageId: 'preferNamedImports',
            line: 5
          },
          {
            messageId: 'preferNamedImports',
            line: 9
          }
        ]
      }
    ],
  });
});
