import { ast, createRule } from '../../utils';

import type * as t from '@typescript-eslint/typescript-estree';

const { traverseResultNodeArray, findNearestParentByType, isImportReact } = ast;

const rule = createRule({
  name: '@dalife/dom-listener-pairs',
  meta: {
    hasSuggestions: true,
    type: 'problem',
    docs: {
      description: 'Be aware of removing a dom listener',
      // category: 'Possible Errors',
      recommended: 'error',
    },
    messages: {
      noRemoveListenerCode: `Listeners are not removed in the effect callback，please add a removeEventListener according to addEventListener`,
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const reportError = (node: t.TSESTree.Node) => {
      context.report({
        messageId: 'noRemoveListenerCode',
        node,
      });
    };
    const targetSpecifiers: t.TSESTree.ImportSpecifier[] = [];
    let reactSpecifier:
      | t.TSESTree.ImportDefaultSpecifier
      | t.TSESTree.ImportNamespaceSpecifier
      | null = null;
    return {
      ImportDeclaration(node) {
        if (!isImportReact(node)) {
          // Filter unrelated imports
          return;
        }
        const moduleScope = context.getScope();
        node.specifiers.forEach((spec) => {
          if (spec.type === 'ImportSpecifier') {
            // Example: import { useEffect, useLayoutEffect as useEffect2 } from 'react';
            if (
              spec.imported.name === 'useEffect' ||
              spec.imported.name === 'useLayoutEffect'
            ) {
              targetSpecifiers.push(spec);
            }
          } else if (spec.type === 'ImportDefaultSpecifier') {
            // Example: import React from 'react';
            reactSpecifier = spec;
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            reactSpecifier = spec;
          }
        });

        const effectKeys = new Set([
          ...(reactSpecifier ? ['useEffect', 'useLayoutEffect'] : []),
          ...targetSpecifiers.map((d) => d.local.name),
        ]);

        effectKeys.forEach((key) => {
          const variable = moduleScope.set.get(key);
          if (!variable) {
            return;
          }
          const { defs, references } = variable;
          if (!defs.length || !references.length) {
            return;
          }
          // @ts-expect-error
          const target = findNearestParentByType<ESTree.CallExpression>(
            references[0].identifier,
            (d) => d.type === 'CallExpression',
          );
          if (!target) {
            return;
          }
          if (
            target.arguments[0]?.type !== 'FunctionExpression' &&
            target.arguments[0]?.type !== 'ArrowFunctionExpression'
          ) {
            return;
          }
          const block = target.arguments[0].body as t.TSESTree.BlockStatement;
          // @ts-expect-error
          const blockNodes: t.TSESTree.Identifier[] = traverseResultNodeArray(
            block,
            (n) =>
              n.type === 'Identifier' &&
              (n.name === 'addEventListener' ||
                n.name === 'removeEventListener'),
          );
          const hasAddEventListener = blockNodes.some(
            (d) => d.name === 'addEventListener',
          );
          const hasRemoveEventListener = blockNodes.some(
            (d) => d.name === 'removeEventListener',
          );
          if (hasAddEventListener && !hasRemoveEventListener) {
            reportError(blockNodes[0]);
          }
        });
      },
    };
  },
});

export { rule };
