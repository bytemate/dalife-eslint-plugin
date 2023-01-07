import {
  parseByTypescriptESLintParser,
  isInReactHooks,
  traverseResultNodeArray,
  combineMemberExpression,
} from './ast';

describe('utils/ast.ts', () => {
  it('ast.isInReactHooks find useEffect success', () => {
    const ast1 = parseByTypescriptESLintParser(`import { useEffect } from 'react';
    export function App() {
      useEffect(() => {
        const a = 0;
      }, []);
    }
`);
    const [a] = traverseResultNodeArray(
      ast1,
      (d) => d.type === 'Identifier' && d.name === 'a',
    );

    const [r1, r2] = isInReactHooks(null, 'useEffect', a);
    expect(r1).toBeTruthy();
    expect(r1 && r2!.type).toBe('CallExpression');
  });

  it('ast.combineMemberExpression', () => {
    expect(
      combineMemberExpression(
        // @ts-ignore
        parseByTypescriptESLintParser(`a.b.c[0].d = [];`).body[0].expression
          .left,
      ),
    ).toEqual('a.b.c.0.d');
    expect(
      combineMemberExpression(
        // @ts-ignore
        (parseByTypescriptESLintParser(`window['addEventListener']`) as any)
          .body[0].expression,
      ),
    ).toEqual('window.addEventListener');
  });
});
