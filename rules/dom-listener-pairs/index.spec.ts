import { rule } from '.';
import { test } from '../../utils';

describe('dom-listener-pairs', () => {
  const ruleTester = test.getRuleTester();
  ruleTester.run('@dalife/dom-listener-pairs', rule, {
    valid: [
      {
        code: `
import React, { useRef, useEffect as useEft, useLayoutEffect } from 'react';
export function test() {
  const dom = useRef();
  const dom2 = useRef();
  useEft(() => {
    const handler = () => {};
    dom.current.addEventListener('click', handler);
    return () => {
      dom.current.removeEventListener('click', handler);
    };
  }, []);
  React.useEffect(() => {
    const handler = () => {};
    dom.current.addEventListener('click', handler);
    return () => {
      dom.current.removeEventListener('click', handler);
    };
  }, []);
  return ref;
}`,
      },
      {
        code: `
import React, { useRef, useEffect as useEft, useLayoutEffect } from 'react';
export function test() {
  const dom = useRef();
  const dom2 = useRef();
  useEft(() => {
    const handler = () => {};
    // dom.current.addEventListener('click', handler);
    return () => {
      // dom.current.removeEventListener('click', handler);
    };
  }, []);
  useLayoutEffect(() => {
    const handler = () => {};
    dom.current.addEventListener('click', handler);
    return () => {
      dom.current.removeEventListener('click', handler);
    };
  }, []);
  return ref;
}`,
      },
    ],
    invalid: [
      {
        code: `import { useEffect } from 'react';
      export function test() {
        useEffect(() => {
          const handler = () => {};
          document.addEventListener('click', handler);
          return () => {
            // document.removeEventListener('click', handler);
          }
        })
      }`,
        errors: [
          {
            messageId: 'noRemoveListenerCode',
          },
        ],
      },
      {
        code: `
        import React, { useRef, useEffect as useEft, useLayoutEffect } from 'react';
        export function test() {
          const dom = useRef();
          const dom2 = useRef();
          useEft(() => {
            const handler = () => {};
            dom.current.addEventListener('click', handler);
            return () => {
              // dom.current.removeEventListener('click', handler);
            };
          }, []);
          useLayoutEffect(() => {
            const handler = () => {};
            dom.current.addEventListener('click', handler);
            return () => {
              // dom.current.removeEventListener('click', handler);
            };
          }, []);
          return ref;
        }`,
        errors: [
          {
            messageId: 'noRemoveListenerCode',
          },
          {
            messageId: 'noRemoveListenerCode',
          },
        ],
      },
    ],
  });
});
