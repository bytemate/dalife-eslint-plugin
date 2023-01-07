import { ESLintUtils } from '@typescript-eslint/experimental-utils';
import { AST_NODE_TYPES } from '@typescript-eslint/types';
import {
  parseAndGenerateServices,
  simpleTraverse,
} from '@typescript-eslint/typescript-estree';

import { defaultESLintOptions } from './constants';

import type {
  ParserServices,
  TSESLint,
} from '@typescript-eslint/experimental-utils';
import type { TypeChecker } from 'typescript';
import type { TSESTree } from '@typescript-eslint/types';

// const Traverser: any = require('eslint/lib/shared/traverser');

export const nodeTypes = AST_NODE_TYPES;

/**
 * 最近的某种类型的 ESTree.Node
 *
 * @param node - AST Node 节点
 * @param condition - 匹配规则
 * @param rootNode - 基准根节点，查找范围不会超过此节点
 */
export function findNearestParentByType<T extends TSESTree.Node>(
  node: TSESTree.Node,
  condition: (v: T) => boolean,
  rootNode?: TSESTree.Node,
): null | T {
  let p: any;
  let cur = node;
  // eslint-disable-next-line no-cond-assign
  while (cur && (p = cur.parent)) {
    if (condition(p)) {
      return p;
    }
    cur = p;
    if (rootNode !== undefined && rootNode === cur) {
      break;
    }
  }
  return null;
}

export function traverseResultNodeArray(
  node: TSESTree.Node,
  filter: (v: TSESTree.Node) => boolean = () => true,
): Array<TSESTree.Node | TSESTree.Node> {
  const results: Array<TSESTree.Node | TSESTree.Node> = [];
  simpleTraverse(node, {
    enter: (n: TSESTree.Node) => {
      if (filter(n)) {
        results.push(n);
      }
    },
  });
  return results;
}

export function getTsUtils(
  context: TSESLint.RuleContext<any, any>,
): {
  typeChecker: TypeChecker;
  parserService: ParserServices;
} | null {
  try {
    const parserService = ESLintUtils.getParserServices(context);
    const typeChecker = parserService.program.getTypeChecker();
    return {
      typeChecker,
      parserService,
    };
  } catch (_e) {
    // TSCProgram not found, then return null;
    return null;
  }
}

export function isInReactHooks<T extends TSESTree.Node | TSESTree.Node>(
  context: TSESLint.RuleContext<any, any> | null,
  hookType:
    | 'useEffect'
    | 'useLayoutEffect'
    | 'useState'
    | 'useReducer'
    | 'useMemo'
    | 'useCallback',
  node: T,
): [true, T] | [false, null] {
  if (context) {
    const { ast } = context.getSourceCode();
    simpleTraverse(ast, {
      enter(n) {
        if (
          n.type === AST_NODE_TYPES.ImportDeclaration &&
          n.source.value === 'react' &&
          n.importKind !== 'type'
        ) {
          n.specifiers.forEach((d) => {
            if (
              d.type === AST_NODE_TYPES.ImportSpecifier &&
              d.imported.name === hookType &&
              d.local.name !== hookType
            ) {
              hookType = d.local.name as typeof hookType;
            }
          });
        }
      },
    });
  }

  const target = findNearestParentByType(
    node,
    (d) =>
      d.type === AST_NODE_TYPES.CallExpression &&
      ((d.callee.type === AST_NODE_TYPES.Identifier &&
        d.callee.name === hookType) ||
        (d.callee.type === AST_NODE_TYPES.MemberExpression &&
          d.callee.property.type === AST_NODE_TYPES.Identifier &&
          d.callee.property.name === hookType)),
  );

  if (!target) {
    return [false, null];
  }
  if (!context) {
    return [true, target as T];
  }
  const vars = context.getDeclaredVariables(target as any);
  if (
    vars.some((v) => {
      if (v.defs.length === 1 && v.defs[0].type === 'ImportBinding') {
        const importStatement = v.defs[0].parent;
        return (
          importStatement.type === AST_NODE_TYPES.ImportDeclaration &&
          importStatement.source.value === 'react'
        );
      }
      return false;
    })
  ) {
    return [true, target as T];
  }
  return [false, null];
}

export function parseByTypescriptESLintParser(code: string) {
  const { ast } = parseAndGenerateServices(
    code,
    defaultESLintOptions.parserOptions as any,
  );
  return appendParentForAst(ast as any);
}

function appendParentForAst(ast: TSESTree.Program) {
  simpleTraverse(ast as any, {
    // @ts-expect-error
    enter(
      node: TSESTree.Node & { parent?: null | TSESTree.Node },
      parent: TSESTree.Node | null,
    ) {
      node.parent = parent || undefined;
    },
  });
  return ast;
}

export function isImportReact(node: any): boolean {
  return (
    node.source.type === 'Literal' &&
    node.source.value &&
    node.source.value === 'react' &&
    node.importKind !== 'type'
  );
}

/**
 * 获取 scope 下的某个 identifier
 *
 * @param scope - 作用域
 * @param name - identifier 名称
 */
export function getIdentifierInScope(
  scope: TSESLint.Scope.Scope,
  name: string,
) {
  const names = name.split('.');
  const tar = names[0];
  const flattenedScopes = flattenScope(scope);
  const identifiers = new Set<TSESTree.Identifier | TSESTree.JSXIdentifier>();
  for (const s of flattenedScopes) {
    s.references
      // eslint-disable-next-line no-loop-func
      .filter((d) => {
        if (d.identifier.name !== tar) {
          if (
            // @ts-expect-error
            d.identifier.parent.type !== 'MemberExpression' ||
            names.length > 1
          ) {
            return false;
          }
          // @ts-expect-error
          let expr: TSESTree.MemberExpression = d.identifier.parent!;
          while (expr.parent?.type === 'MemberExpression') {
            expr = expr.parent;
          }
          return (
            (expr.property.type === 'Identifier' &&
              expr.property.name === tar) ||
            (expr.property.type === 'Literal' && expr.property.value === tar)
          );
        }
        if (d.identifier.name === tar) {
          return true;
        }
        // @ts-expect-error
        if (d.identifier.parent.type === 'MemberExpression') {
          // @ts-expect-error
          const memberExpr: ESTree.MemberExpression = d.identifier.parent;
          const code = combineMemberExpression(memberExpr);
          if (code === name) {
            return true;
          }
        }
        return false;
      })
      .forEach((d) => identifiers.add(d.identifier));
  }
  return Array.from(identifiers);
}

/**
 * 递归遍历所有 scope 及子 scope
 *
 * @param scope - 作用域
 * @param callback - 遍历函数
 */
export function traverseScope(
  scope: TSESLint.Scope.Scope,
  callback: (s: TSESLint.Scope.Scope) => void,
) {
  callback(scope);
  for (const s of scope.childScopes) {
    traverseScope(s, callback);
  }
}

export function flattenScope(
  scope: TSESLint.Scope.Scope,
): TSESLint.Scope.Scope[] {
  const results: TSESLint.Scope.Scope[] = [];
  traverseScope(scope, (s) => results.push(s));
  return results;
}

/**
 * 将 MemberExpression 拼成字符串
 * eg: window['addEventListener'] AST =\> "window.addEventListener"
 * eg: array[0].a AST =\> "array.0.a"
 *
 * @param node - MemberExpression 节点
 */
export function combineMemberExpression(
  node: TSESTree.MemberExpression,
): string {
  const results: string[] = [];
  let cur:
    | TSESTree.MemberExpression
    | TSESTree.Identifier
    | TSESTree.Literal = node;
  while (cur.type === 'MemberExpression') {
    const p = cur.property;
    if (p.type === 'Literal') {
      results.unshift(String(p.value));
    } else if (p.type === 'Identifier') {
      results.unshift(p.name);
    }
    // @ts-expect-error
    cur = cur.object;
  }
  if (cur.type === 'Identifier') {
    results.unshift(cur.name);
  } else if (cur.type === 'Literal') {
    results.unshift(String(cur.value));
  }

  return results.join('.');
}

/**
 * 获取某个 AST 节点的最近 Scope
 *
 * @param context - 当前 eslint 规则上下文
 * @param node - AST 节点
 */
export function getNodeScope(
  context: TSESLint.RuleContext<any, any>,
  node: TSESTree.Node,
) {
  let cur: typeof node | undefined = node;
  const sm = context.getSourceCode().scopeManager;
  if (!sm) {
    return null;
  }
  let rtn = sm.acquire(cur);
  while (rtn === null && cur.parent) {
    cur = cur.parent;
    rtn = sm.acquire(cur);
  }
  return rtn;
}
