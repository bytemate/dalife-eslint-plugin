import { ast, createRule } from '../../utils';

import type { TSESTree } from '@typescript-eslint/typescript-estree';

const { isImportReact, findNearestParentByType } = ast;

const rule = createRule({
  name: '@dalife/timer-must-clear',
  defaultOptions: [],
  meta: {
    hasSuggestions: true,
    type: 'problem',
    messages: {
      noRemoveListenerCode: `Timer is not cleared in effect, Please adding {{clearCode}}`,
    },
    docs: {
      recommended: 'error',
      description: 'Avoid to forget clear timer in effect',
      // category: 'Possible Errors',
    },
    schema: [],
  },
  create(context) {
    const reportError = (node: TSESTree.Node, clearCode: string) => {
      context.report({
        messageId: 'noRemoveListenerCode',
        data: { clearCode },
        node,
      });
    };
    const sourceCode = context.getSourceCode();
    const targetSpecifiers: string[] = [];
    let reactSpecifier:
      | TSESTree.ImportDefaultSpecifier
      | TSESTree.ImportNamespaceSpecifier
      | null = null;
    return {
      ImportDeclaration(node) {
        if (!isImportReact(node)) {
          return;
        }
        node.specifiers.forEach((spec) => {
          if (spec.type === 'ImportSpecifier') {
            // Example: import { useEffect, useLayoutEffect as useEffect2 } from 'react';
            if (
              spec.imported.name === 'useEffect' ||
              spec.imported.name === 'useLayoutEffect'
            ) {
              targetSpecifiers.push(spec.local.name);
            }
          } else if (spec.type === 'ImportDefaultSpecifier') {
            // Example: import React from 'react';
            reactSpecifier = spec;
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            reactSpecifier = spec;
          }
        });
      },
      Identifier(node) {
        if (!targetSpecifiers.includes(node.name)) {
          return;
        }
        if (
          (node.parent?.type !== 'CallExpression' &&
            node.parent?.type !== 'MemberExpression') ||
          (node.parent?.type === 'MemberExpression' &&
            node.parent?.parent?.type !== 'CallExpression')
        ) {
          return;
        }
        const callExpr = findNearestParentByType<TSESTree.CallExpression>(
          node,
          (d) => d.type === ast.nodeTypes.CallExpression,
        );

        if (!callExpr) {
          return;
        }
        const effectFunc: TSESTree.CallExpressionArgument | undefined =
          callExpr.arguments[0];

        if (
          !effectFunc ||
          (effectFunc.type !== ast.nodeTypes.ArrowFunctionExpression &&
            effectFunc.type !== ast.nodeTypes.FunctionExpression)
        ) {
          return;
        }
        if (!sourceCode.scopeManager) {
          return;
        }
        const scope = sourceCode.scopeManager.acquire(effectFunc);
        if (!scope) {
          return;
        }
        // const txt = context
        //   .getSourceCode()
        //   // @ts-ignore
        //   .text.substring(...scope.block.range);
        const timeoutIdentifiers = ast.getIdentifierInScope(
          scope,
          'setTimeout',
        );
        if (
          timeoutIdentifiers.length > 0 &&
          (ast.getIdentifierInScope(scope, 'clearTimeout').length === 0 ||
            !hasAssignment(timeoutIdentifiers[0]))
        ) {
          reportError(timeoutIdentifiers[0], 'clearTimeout');
        }
        const rafIdentifiers = ast.getIdentifierInScope(
          scope,
          'requestAnimationFrame',
        );
        if (
          rafIdentifiers.length > 0 &&
          (ast.getIdentifierInScope(scope, 'cancelAnimationFrame').length ===
            0 ||
            !hasAssignment(rafIdentifiers[0]))
        ) {
          reportError(rafIdentifiers[0], 'cancelAnimationFrame');
        }
        const intervalIdentifiers = ast.getIdentifierInScope(
          scope,
          'setInterval',
        );
        if (
          intervalIdentifiers.length > 0 &&
          (ast.getIdentifierInScope(scope, 'clearInterval').length === 0 ||
            !hasAssignment(intervalIdentifiers[0]))
        ) {
          reportError(intervalIdentifiers[0], 'clearInterval');
        }
      },
    };
  },
});

function hasAssignment(node: TSESTree.Identifier | TSESTree.JSXIdentifier) {
  if (
    // window.setTimeout
    node?.name === 'window' &&
    node.parent?.type === 'MemberExpression' &&
    node.parent?.parent?.type === 'CallExpression' &&
    (node.parent?.parent?.parent?.type === 'VariableDeclarator' ||
      node.parent?.parent?.parent?.type === 'AssignmentExpression')
  ) {
    return true;
  } else if (
    // setTimeout
    node?.parent?.type === 'CallExpression' &&
    (node?.parent?.parent?.type === 'VariableDeclarator' ||
      node?.parent?.parent?.type === 'AssignmentExpression')
  ) {
    return true;
  }
  return false;
}

export { rule };
