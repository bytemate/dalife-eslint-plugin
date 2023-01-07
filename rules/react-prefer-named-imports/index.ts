import { createRule } from '../../utils';
import type { TSESLint } from '@typescript-eslint/experimental-utils'
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import { simpleTraverse } from '@typescript-eslint/typescript-estree';
import { AST_NODE_TYPES } from '@typescript-eslint/types';

const rule = createRule({
  name: '@dalife/react-prefer-named-imports',
  defaultOptions: [],
  meta: {
    hasSuggestions: true,
    docs: {
      description: 'React prefer named imports',
      // category: 'Best Practices',
      recommended: 'warn',
    },
    type: 'problem',
    messages: {
      preferNamedImports: `React prefer named imports`,
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const isReactImportPath =
          node.source.value === 'React' || node.source.value === 'react';
        if (!isReactImportPath) {
          return;
        }

        const reactDefaultImport = node.specifiers.find(
          (specifier) =>
            specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier &&
            specifier.local.name === 'React',
        );

        if (!reactDefaultImport) {
          return;
        }

        let canDestructReactVariable = true;
        const reactIdentifiers: Record<
          string,
          TSESTree.MemberExpression | TSESTree.ImportSpecifier
        > = {};
        const reactTypeIdentifiers: Record<
          string,
          TSESTree.TSQualifiedName
        > = {};
        const namedImports = new Set<string>();
        const namedTypeImports = new Set<string>();

        const { ast } = context.getSourceCode();

        const isVariableDeclared = (name: string) => {
          let isVariableDeclared = false;
          simpleTraverse(ast, {
            Identifier(n) {
              const identifier = n as TSESTree.Identifier;
              if (
                identifier.name === name &&
                identifier.parent?.type !== AST_NODE_TYPES.MemberExpression &&
                identifier.parent?.type !== AST_NODE_TYPES.TSQualifiedName
              ) {
                isVariableDeclared = true;
              }
            },
          });
          return isVariableDeclared;
        };

        simpleTraverse(ast, {
          TSQualifiedName(n) {
            const qualifiedName = n as TSESTree.TSQualifiedName;
            // import React from 'react';
            // const A: React.FC = () => null;
            if (
              qualifiedName.left.type === AST_NODE_TYPES.Identifier &&
              qualifiedName.left.name === 'React'
            ) {
              const id = qualifiedName.right.name;
              reactTypeIdentifiers[id] = qualifiedName;

              if (isVariableDeclared(id)) {
                canDestructReactVariable = false;
                context.report({
                  messageId: 'preferNamedImports',
                  node: qualifiedName,
                });
              } else {
                namedTypeImports.add(id);

                context.report({
                  messageId: 'preferNamedImports',
                  node: qualifiedName,
                  fix(fixer) {
                    return fixer.replaceText(qualifiedName, id);
                  },
                });
              }
            }
          },
          MemberExpression(n) {
            const memberExpression = n as TSESTree.MemberExpression;

            // import React from 'react';
            // React.useState
            if (
              memberExpression.object.type === AST_NODE_TYPES.Identifier &&
              memberExpression.object.name === 'React'
            ) {
              const property = (memberExpression.property as TSESTree.Identifier)
                .name;
              reactIdentifiers[property] = memberExpression;

              // useState is declared
              if (isVariableDeclared(property)) {
                canDestructReactVariable = false;
                context.report({
                  messageId: 'preferNamedImports',
                  node: memberExpression,
                });
              } else {
                namedImports.add(property);
                context.report({
                  messageId: 'preferNamedImports',
                  node: memberExpression,
                  fix(fixer) {
                    return fixer.replaceText(memberExpression, property);
                  },
                });
              }
            }
          },
        });

        // Can eliminate importing react
        if (canDestructReactVariable) {
          const reactTypeIdentifiersKeys = Object.keys(reactTypeIdentifiers);
          if (
            Object.keys(reactIdentifiers).length ||
            reactTypeIdentifiersKeys.length
          ) {
            node.specifiers.forEach((specifier) => {
              if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
                const name = specifier.imported.name;
                reactIdentifiers[name] = specifier;
              }
            });
            const reactIdentifiersKeys = Object.keys(reactIdentifiers);
            context.report({
              messageId: 'preferNamedImports',
              node,
              fix(fixer) {
                // variables and types
                const importText =
                  'import { ' +
                  reactIdentifiersKeys.sort().join(', ') +
                  ` } from 'react';`;
                const importTypeText =
                  'import type { ' +
                  reactTypeIdentifiersKeys.sort().join(', ') +
                  ` } from 'react';`;
                return [
                  reactIdentifiersKeys.length && fixer.replaceText(node, importText),
                  reactIdentifiersKeys.length && reactTypeIdentifiersKeys.length && fixer.insertTextAfter(node, `\n${importTypeText}`),
                  !reactIdentifiersKeys.length && reactTypeIdentifiersKeys.length && fixer.replaceText(node, importTypeText)
                ].filter(Boolean) as unknown as TSESLint.RuleFix
              },
            });
          }
        } else {
          // Appending React
          if (namedImports.size) {
            context.report({
              messageId: 'preferNamedImports',
              node,
              fix(fixer) {
                return fixer.insertTextAfter(
                  reactDefaultImport,
                  `, { ${[...namedImports].join(', ')} }`,
                );
              },
            });
          }

          if (namedTypeImports.size) {
            context.report({
              messageId: 'preferNamedImports',
              node,
              fix(fixer) {
                return fixer.insertTextAfter(
                  node,
                  '\nimport type { ' +
                  [...namedTypeImports].join(', ') +
                  ` } from 'react';`,
                );
              },
            });
          }
        }
      },
    };
  },
});

export { rule };
