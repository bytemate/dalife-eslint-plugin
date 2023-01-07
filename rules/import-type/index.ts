import { AST_NODE_TYPES } from '@typescript-eslint/types';
import type { TSESTree } from '@typescript-eslint/typescript-estree';

import { createRule } from '../../utils';

const rule = createRule({
  name: '@dalife/import-type',
  defaultOptions: [],
  meta: {
    hasSuggestions: true,
    docs: {
      description: '{{imports}} is only be used as types, please change it to import type syntax',
      // category: 'Possible Errors',
      recommended: 'error',
    },
    type: 'problem',
    messages: {
      importsUsedAsType: `{{imports}} is only be used as types, please change it to import type syntax`,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          typeOnImportedNames: {
            type: 'boolean',
          }
        },
      },
    ],
  },
  create(context) {
    // const sourceCode = context.getSourceCode();
    const reportError = (
      node: TSESTree.ImportDeclaration,
      imports: Array<string>,
    ) => {
      const typeOnImportedNames = (context.options as unknown as RuleOptions)?.[0]?.typeOnImportedNames || false;
      context.report({
        messageId: 'importsUsedAsType',
        data: { imports: imports.toString() },
        node,
        fix(fixer) {
          // raw import specifier
          const source = node.source?.raw;
          let value = '';
          let type = '';
          let defaultImport = '';
          // TODO:  Refactor to regex matching replace for better performance

          const valueImports: string[] = [];
          const typeImports: string[] = [];
          node.specifiers
            .forEach((specifier: any) => {
              // 获取default
              if (specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
                defaultImport = specifier.local.name;
              } else if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
                const localName = specifier.local?.name;
                const importedName = specifier.imported?.name;
                const name = localName || importedName;
                let nextName = '';
                if (localName && localName !== importedName) {
                  nextName = `${importedName} as ${localName}`;
                } else {
                  nextName = importedName;
                }
                // value
                if (!imports.includes(name)) {
                  valueImports.push(nextName);
                } else {
                  if (typeOnImportedNames) {
                    typeImports.push(`type ${nextName}`);
                  } else {
                    typeImports.push(nextName);
                  }
                }
              }
            });
          value = valueImports.join(', ');
          type = typeImports.join(', ');
          let finalText = '';

          if (typeOnImportedNames) {
            // value exists
            if (value || defaultImport) {
              defaultImport = defaultImport ? (defaultImport + ', ') : '';
              value = value ? (value + ', ') : '';
              finalText = `import ${defaultImport}{ ${value}${type} } from ${source};`;
            } else {
              finalText = `import { ${type} } from ${source};`;
            }
          } else {
            // value exists
            const typeImport = `import type { ${type} } from ${source};`;
            if (value || defaultImport) {
              // Add a leading space when switching line
              const space = new Array(node.loc.start.column).fill(' ').join('');
              let valueImport = defaultImport;
              if (value) {
                if (valueImport) {
                  valueImport += ', ';
                }
                valueImport += `{ ${value} }`;
              }
              finalText = `import ${valueImport} from ${source};\n${space}${typeImport}`;
            } else {
              finalText = typeImport;
            }
          }
          return fixer.replaceText(node, finalText);
        },
      });
    };

    return {
      // Detect the imports usage
      ImportDeclaration(node) {
        const moduleScope = context.getScope();
        // Store the specifiers by importing a module
        const imports: Record<string, any> = {};
        // Store the usage value or type
        const types: Record<string, boolean> = {};

        // Detect all imports usage and save the result
        node.specifiers.forEach((spec) => {
          if (spec.type === 'ImportSpecifier' && (node.importKind !== 'type' && spec.importKind !== 'type')) {
            const { local } = spec;
            if (local) {
              const { name } = local;
              imports[name] = node;
            }
          }
        });
        const keys = Object.keys(imports);

        keys.forEach((key) => {
          const variable = moduleScope.set.get(key);
          if (variable) {
            const { defs, references } = variable;
            if (!defs.length || !references.length) {
              // return;
            } else {
              references.forEach((reference) => {
                // const { name } = reference.identifier;
                // console.log(reference, 'reference');
                if (!types[key]) {
                  const isType = reference.isTypeReference;
                  const isValue = reference.isValueReference;
                  if (isValue) {
                    types[key] = true;
                  } else if (isType) {
                    types[key] = false;
                  }
                }
              });
            }
          }
        });
        const errors: Array<string> = [];
        for (const t in types) {
          if (types[t] === false) {
            errors.push(t);
          }
        }
        if (errors.length > 0) {
          reportError(node, errors);
        }
      },
    };
  },
});

export type RuleOptions = [
  {
    typeOnImportedNames: boolean,
  },
];

export { rule };
