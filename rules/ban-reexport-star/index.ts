import { createRule } from '../../utils';

const rule = createRule({
  name: '@dalife/export-all',
  defaultOptions: [],

  meta: {
    hasSuggestions: true,
    type: 'problem',
    fixable: undefined,
    docs: {
      description: `export * from 'xxx' is not allowed`,
      // category: 'Possible Errors',
      recommended: 'error',
    },
    messages: {
      BanReexportedStar: `export * from 'xxx' is not allowed`,
    },
    schema: [],
  },

  create(context) {
    return {
      ExportAllDeclaration(node) {
        if (!node.exported) {
          context.report({
            messageId: 'BanReexportedStar',
            node,
          });
        }
      },
    };
  },
});

export { rule };
