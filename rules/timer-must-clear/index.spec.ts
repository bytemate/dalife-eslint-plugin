// import * as fs from 'fs';
// import * as path from 'path';
import { rule } from '.';
import { test } from '../../utils';

describe('timer-must-clear', () => {
  const ruleTester = test.getRuleTester();
  ruleTester.run('@dalife/timer-must-clear', rule, {
    valid: [
      {
        code: `
import { useEffect } from 'react';
export function Test() {
  useEffect(() => {
      const id = window.setTimeout(() => {});
    return () => {
      clearTimeout(id);
    };
  }, []);
  return null;
}`,
      },
    ],
    invalid: [
      {
        code: `import { useEffect } from 'react';
export function test() {
  useEffect(() => {
    setTimeout(() => {});
    return () => {
      clearTimeout(1);
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
        import React, { useLayoutEffect } from 'react';
export function test() {
  useLayoutEffect(() => {
    const handler = () => {};
    setInterval(() => {});
    return () => {
      // clearInterval(1);
    };
  }, []);
}`,
        errors: [
          {
            messageId: 'noRemoveListenerCode',
          },
        ],
      },
    ],
  });
});
