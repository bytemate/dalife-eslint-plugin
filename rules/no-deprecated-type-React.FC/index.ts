
import { createRule } from '../../utils';
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import { AST_NODE_TYPES } from '@typescript-eslint/types';

const isIdentifier = (node: any): node is TSESTree.Identifier => node?.type === AST_NODE_TYPES.Identifier;

const rule = createRule({
  name: '@dalife/no-deprecated-type-React.FC',
  defaultOptions: [],
  meta: {
    hasSuggestions: true,
    docs: {
      description: 'no deprecated type React.FC',
      // category: 'Best Practices',
      recommended: 'warn',
    },
    type: 'problem',
    messages: {
      deprecatedFC: `no deprecated type React.FC`,
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {

    return {
      ImportDeclaration(node) {
        if (node.source.value === 'react' && node.importKind === 'type') {
          const specifierFC = node.specifiers.find(s => s.type === AST_NODE_TYPES.ImportSpecifier && s.imported.name === 'FC')
          if (specifierFC) {
            context.report({
              messageId: 'deprecatedFC',
              loc: node.loc,
              fix(fixer) {
                if (node.specifiers.length === 1) {
                  return fixer.remove(node)
                }
                return fixer.remove(specifierFC);
              }
            })
          }
        }
      },
      TSTypeReference(node) {
        const { typeName, typeParameters } = node;

        const isReactFC = isIdentifier(typeName)
          ? typeName.name === 'FC'
          : isIdentifier(typeName.left) && typeName.left.name === 'React' && typeName.right.name === 'FC';

        if (isReactFC) {
          context.report({
            messageId: 'deprecatedFC',
            loc: node.loc,
            fix(fixer) {
              if (node.parent && node.parent.parent?.parent?.type === AST_NODE_TYPES.VariableDeclarator) {
                const { init } = node.parent.parent.parent;
                if (init?.type === AST_NODE_TYPES.ArrowFunctionExpression || init?.type === AST_NODE_TYPES.FunctionExpression) {
                  const { params } = init;
                  if (params.length) {
                    const typeParams = typeParameters?.params || [];
                    return [
                      fixer.insertTextAfter(params[0], `: ${context.getSourceCode().getText(typeParams[0])}`),
                      fixer.remove(node.parent)
                    ];
                  }
                  return fixer.remove(node.parent);
                }
              }
              return null;
            }
          })
        }
      },
    }
  },
});

export { rule };
