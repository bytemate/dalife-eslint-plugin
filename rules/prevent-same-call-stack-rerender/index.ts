/* eslint-disable max-statements */
import { AST_NODE_TYPES } from '@typescript-eslint/types';

import { createRule, ast } from '../../utils';

import type { TSESTree } from '@typescript-eslint/types';
import type { RuleContext } from '@typescript-eslint/experimental-utils/dist/ts-eslint';

export const rule = createRule({
  name: '@dalife/prevent-same-call-stack-rerender',
  defaultOptions: [],
  meta: {
    hasSuggestions: true,
    docs: {
      description: 'Avoiding to render react component render multiple times',
      // category: 'Best Practices',
      recommended: 'warn',
    },
    messages: {
      default:
        'Calling {{msg}} multiple times leads to rerender the react components multiple times, please try to merge them into one state or use unstable_batchedUpdates to composite them into one render',
    },
    type: 'suggestion',
    fixable: 'code',
    schema: [],
  },
  create(context) {
    let useStateSpecifier: undefined | TSESTree.ImportSpecifier;
    const setStateIdentifiers: TSESTree.Identifier[] = [];
    const dedupeBlockCheckWeakSet = new WeakSet<any>();
    let batchedUpdates: TSESTree.Identifier | undefined;

    return {
      'ImportDeclaration > Literal': (node: TSESTree.Literal) => {
        if (node.value !== 'react' && node.value !== 'react-dom') {
          return;
        }
        if (node.value === 'react') {
          const importDeclaration = node.parent as TSESTree.ImportDeclaration;
          useStateSpecifier = importDeclaration.specifiers.find(
            (d) =>
              d.type === AST_NODE_TYPES.ImportSpecifier &&
              d.imported.name === 'useState',
          ) as TSESTree.ImportSpecifier;

          const v = context.getDeclaredVariables(useStateSpecifier)[0];
          if (!v) {
            return;
          }
          const { references } = v;
          for (const ref of references) {
            if (
              ref.identifier.parent?.type === AST_NODE_TYPES.CallExpression &&
              ref.identifier.parent?.parent?.type ===
              AST_NODE_TYPES.VariableDeclarator &&
              ref.identifier.parent?.parent.id.type ===
              AST_NODE_TYPES.ArrayPattern &&
              ref.identifier.parent.parent.id.elements.length === 2
            ) {
              setStateIdentifiers.push(
                ref.identifier.parent.parent.id
                  .elements[1] as TSESTree.Identifier,
              );
            }
          }
        } else {
          // eslint-disable-next-line max-len
          const importSpecifier = (node.parent! as TSESTree.ImportDeclaration).specifiers.find(
            (d) =>
              d.type === AST_NODE_TYPES.ImportSpecifier &&
              d.local.name === 'unstable_batchedUpdates',
          );
          if (importSpecifier) {
            batchedUpdates = (importSpecifier as TSESTree.ImportSpecifier)
              .imported;
          }
        }
      },

      'CallExpression:exit': (node: TSESTree.CallExpression) => {
        if (
          !setStateIdentifiers.length ||
          node.callee.type !== AST_NODE_TYPES.Identifier
        ) {
          return;
        }
        const { name } = node.callee;
        if (!setStateIdentifiers.some((d) => d.name === name)) {
          return;
        }

        // 检查是否在 FunctionScope 中声明，暂不检查，让 ts 避免这种问题
        // const scope = ast.getNodeScope(context, node.callee);
        // if (!/Function/.test(scope?.block.type ?? '')) {
        //   return;
        // }

        const block: TSESTree.BlockStatement = ast.findNearestParentByType(
          node.callee,
          (n) => n.type === AST_NODE_TYPES.BlockStatement,
        ) as TSESTree.BlockStatement;

        // 避免重复检查 block
        if (!dedupeBlockCheckWeakSet.has(block)) {
          dedupeBlockCheckWeakSet.add(block);
        } else {
          return;
        }

        // block in react control
        if (isBlockInReactControl(block, context, batchedUpdates)) {
          return;
        }

        // Record the number of calling setState
        const setStateCalledStack: string[] = [];
        for (const expr of block.body) {
          if (expr.type !== AST_NODE_TYPES.ExpressionStatement) {
            continue;
          }
          if (expr.expression.type === AST_NODE_TYPES.AwaitExpression) {
            setStateCalledStack.length = 0;
          } else if (
            expr.expression.type === AST_NODE_TYPES.CallExpression &&
            expr.expression.callee.type === AST_NODE_TYPES.Identifier &&
            setStateIdentifiers.some(
              (d) =>
                expr.expression.type === AST_NODE_TYPES.CallExpression &&
                d.name === (expr.expression.callee as TSESTree.Identifier).name,
            )
          ) {
            setStateCalledStack.push(expr.expression.callee.name);
            if (setStateCalledStack.length > 1) {
              context.report({
                messageId: 'default',
                node,
                data: {
                  msg: setStateCalledStack.join('、'),
                },
              });
              break;
            }
          }
        }
      },
    };
  },
});

function isBlockInReactControl(
  block: TSESTree.BlockStatement,
  ctx: RuleContext<any, any>,
  batchedUpdates: undefined | TSESTree.Identifier,
) {
  if (!block.parent) {
    return true;
  }

  if (
    block.parent.type === AST_NODE_TYPES.FunctionExpression ||
    block.parent.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    if (
      // xxxxx(() => {});
      block.parent.parent?.type === AST_NODE_TYPES.CallExpression &&
      block.parent.parent.callee.type === AST_NODE_TYPES.Identifier
    ) {
      return (
        ['useEffect', 'useLayoutEffect', batchedUpdates?.name || ''].indexOf(
          block.parent.parent.callee.name,
        ) >= 0
      );
    }

    // JSX returns true
    if (block.parent.parent?.type === AST_NODE_TYPES.JSXExpressionContainer) {
      return true;
    }

    /**
     * @example
     * ```ts
     * const handleClick = () => { setA(); setB(); }
     * ```
     */
    if (block.parent.parent?.type === AST_NODE_TYPES.VariableDeclarator) {
      const { id } = block.parent.parent;
      const scope = ctx.getSourceCode().scopeManager?.scopes.find((s) => {
        return s.references.find((ref) => {
          return ref.identifier === id;
        });
      });
      if (!scope) {
        return true;
      }
      const _ref = scope.references.find((ref) => ref.identifier === id);
      // filter self node
      const usedRefs = _ref?.resolved?.references.filter((d) => d !== _ref);
      // If refs is not used, returns true
      if (!usedRefs || !usedRefs.length) {
        return true;
      }

      const scopeRootNode = scope.block as TSESTree.Node;
      if (
        usedRefs.some((ref) => {
          // eslint-disable-next-line max-len
          const jsxAttrNode: TSESTree.JSXAttribute | null = ast.findNearestParentByType(
            ref.identifier,
            (d) => d.type === AST_NODE_TYPES.JSXAttribute,
            scopeRootNode,
          ) as any;
          if (!jsxAttrNode) {
            return false;
          }
          // const timerNode = ast.findNearestParentByType(
          //   ref.identifier,
          //   (d) => {
          //     return (
          //       (d.type === AST_NODE_TYPES.CallExpression &&
          //         d.callee.type === AST_NODE_TYPES.Identifier &&
          //         [
          //           'setTimeout',
          //           'setInterval',
          //           'requestAnimationFrame',
          //         ].includes(d.callee.name)) ||
          //       (d.type === AST_NODE_TYPES.MemberExpression &&
          //         d.object.type === AST_NODE_TYPES.Identifier &&
          //         d.object.name === 'window' &&
          //         d.property.type === AST_NODE_TYPES.Identifier &&
          //         [
          //           'setTimeout',
          //           'setInterval',
          //           'requestAnimationFrame',
          //         ].includes(d.property.name))
          //     );
          //   },
          //   jsxAttrNode,
          // );
          // if (timerNode) {
          //   return false;
          // }

          const otherCallExpression = ast.findNearestParentByType(
            ref.identifier,
            (d) => {
              return (
                (d.type === AST_NODE_TYPES.CallExpression &&
                  d.callee !== ref.identifier) ||
                d.type === AST_NODE_TYPES.MemberExpression
              );
            },
            jsxAttrNode,
          );
          if (otherCallExpression) {
            return false;
          }

          // Any other block
          const otherBlock = ast.findNearestParentByType(
            ref.identifier,
            (d) => {
              return (
                d.type === AST_NODE_TYPES.BlockStatement &&
                !!d.parent &&
                d.parent.type.toString().indexOf('Function') >= 0 &&
                d.parent.parent?.type !== AST_NODE_TYPES.JSXExpressionContainer
              );
            },
            jsxAttrNode,
          );
          if (otherBlock) {
            return false;
          }
          return true;
        })
      ) {
        return true;
      }
    }
  }
  return false;
}
