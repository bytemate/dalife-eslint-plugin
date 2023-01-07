import { createRule } from '../../utils';
import { AST_NODE_TYPES } from '@typescript-eslint/types';

import type { TSESTree } from '@typescript-eslint/types';

export const rule = createRule({
  name: '@dalife/react-v17',
  defaultOptions: [],
  meta: {
    hasSuggestions: true,
    docs: {
      description:
        'React@17 do not need `import React from "react";` any more; This rule will remove useless import expression.',
      // category: 'Stylistic Issues',
      recommended: 'warn',
    },
    messages: {
      default: 'R17 do not need `import React from "react";` any more',
    },
    type: 'suggestion',
    fixable: 'code',
    schema: [],
  },
  create(context) {
    const fileName = context.getFilename();

    if (!fileName.endsWith('x')) {
      return {};
    }

    let reactSpec:
      | null
      | undefined
      | TSESTree.ImportNamespaceSpecifier
      | TSESTree.ImportDefaultSpecifier = null;

    let useless = false;
    let multiple = false;

    return {
      'ImportDeclaration > Literal': (node: TSESTree.Literal) => {
        if (node.value !== 'react') {
          return;
        }
        const importDeclaration = node.parent as TSESTree.ImportDeclaration;
        multiple = importDeclaration.specifiers.length > 1;
        // @ts-expect-error
        reactSpec = importDeclaration.specifiers.find(
          (d) =>
            d.type === AST_NODE_TYPES.ImportNamespaceSpecifier ||
            d.type === AST_NODE_TYPES.ImportDefaultSpecifier,
        );
        if (
          reactSpec &&
          context
            .getDeclaredVariables(reactSpec)[0]
            .references.filter((d) => d.identifier !== reactSpec!.local)
            .length === 0
        ) {
          useless = true;
        }
      },
      'Program:exit': () => {
        if (useless && reactSpec) {
          context.report({
            messageId: 'default',
            node: reactSpec,
            fix(fixer) {
              if (multiple) {
                const sourceCode = context.getSourceCode().getTokensBetween(
                  reactSpec!,
                  // @ts-expect-error
                  reactSpec!.parent!.specifiers[1],
                );
                const [start] = reactSpec!.range;
                const [, end] = sourceCode[sourceCode.length - 1].range;
                return fixer.removeRange([start, end - 1]);
              } else {
                const [start, end] = reactSpec!.parent!.range;
                return fixer.removeRange([start, end + 1]);
              }
            },
          });
        }
      },
    };
  },
});
