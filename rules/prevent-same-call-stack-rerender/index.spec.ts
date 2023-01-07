import { rule } from '.';
import { test } from '../../utils';

describe('prevent-same-call-stack-rerender', () => {
  const ruleTester = test.getRuleTester();
  ruleTester.run('@dalife/prevent-same-call-stack-rerender', rule, {
    valid: [
      {
        filename: 'index.tsx',
        code: `
          import { useEffect, useState } from 'react';
          import { createPortal } from 'react-dom';

          export function Foo() {
            const handleClick = () => { setA(); setB(); }
            const [a, setA] = useState();
            const [b, setB] = useState();

            useEffect(() => {
              setA();
              setB();
            }, []);

            const handleClick = () => {
              setA();
              setB();
            }

            const handleClick2 = () => {
              setA();
              setB();
            }

            const elm = <div onClick={() => { handleClick2(); }}></div>;

            return (
              <button onTouchStart={handleClick} onClick={() => {
                setA();
                setB();
              }}>OK</button>
            );
          }
        `,
      },
      {
        filename: 'index.tsx',
        code: `
        import { useState } from 'react';
        import { unstable_batchedUpdates } from 'react-dom';

        export default () => {
          const [a, setA] = useState();
          const [b, setB] = useState();
          const handleClick = () => {
            unstable_batchedUpdates(() => {
              setA();
              setB();
            });
          }

          return (
            <button onClick={() => {
              asyncWrap(handleClick);
            }}>Reset</button>
          );
        }
        `,
      },
    ],
    invalid: [
      {
        filename: 'index.tsx',
        code: `
        import { useState, useEffect } from 'react';

        export default () => {
          const [a, setA] = useState();
          const [b, setB] = useState();
          useEffect(() => {
            const i = window.setTimeout(() => {
              setA('a');
              setB('b');
            }, 16);
            return () => {
              clearTimeout(i);
            }
          }, []);
          return (
            <button onClick={() => {
              setTimeout(() => {
                setA('');
                setB('');
              });
            }}>Reset</button>
          );
        }
               `,
        errors: [{ messageId: 'default' }, { messageId: 'default' }],
      },
      {
        filename: 'index.tsx',
        code: `
        import { useState } from 'react';
        export default () => {
          const [a, setA] = useState();
          const [b, setB] = useState();
          const handleClick = () => {
            setA();
            setB();
          }

          return (
            <button onClick={() => {
              asyncWrap(handleClick);
            }}>Reset</button>
          );
        }
        `,
        errors: [{ messageId: 'default' }],
      },
    ],
  });
});
