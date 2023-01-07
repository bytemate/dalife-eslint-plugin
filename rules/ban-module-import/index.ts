import minimatch from 'minimatch';
import { createRule } from '../../utils';

import type { TSESTree } from '@typescript-eslint/types';
import type {
  RuleListener,
  RuleContext,
  RuleMetaDataDocs,
  RuleMetaData,
} from '@typescript-eslint/experimental-utils/dist/ts-eslint';

type CreateRuleMetaDocs = Omit<RuleMetaDataDocs, 'url'>;
type CreateRuleMeta<TMessageIds extends string> = {
  docs: CreateRuleMetaDocs;
} & Omit<RuleMetaData<TMessageIds>, 'docs'>;
type RuleModule<
  TOptions extends readonly unknown[],
  TMessageIds extends string,
  TRuleListener extends RuleListener = RuleListener
> = Readonly<{
  name: string;
  meta: CreateRuleMeta<TMessageIds>;
  defaultOptions: Readonly<TOptions>;
  create: (
    context: Readonly<RuleContext<TMessageIds, TOptions>>,
    optionsWithDefault: Readonly<TOptions>,
  ) => TRuleListener;
}>;

export const ruleModule: RuleModule<Array<any>, 'ban'> = {
  name: '@dalife/ban-module-import',
  defaultOptions: [],
  meta: {
    hasSuggestions: true,
    docs: {
      description: 'Specifies which modules can not be used',
      // category: 'Best Practices',
      recommended: 'warn',
    },
    type: 'problem',
    messages: {
      ban: `{{target}} is forbidden to import。\nReason：{{reason}}\nSuggestion：{{suggestion}}`,
    },
    schema: [
      {
        type: 'object',
        properties: {
          banModules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                moduleName: { type: 'string' },
                reason: { type: 'string' },
                suggestion: { type: 'string' },
              },
              required: ['moduleName', 'reason'],
            },
          },
          banModulesWithSpecifiers: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  specifier: { type: 'string' },
                  reason: { type: 'string' },
                  suggestion: { type: 'string' },
                },
                required: ['specifier', 'reason'],
              },
            },
          },
        },
      },
    ],
  },
  create(context) {
    const [
      { banModules, banModulesWithSpecifiers = {} },
    ] = (context.options as unknown) as RuleOptions;
    // const sourceCode = context.getSourceCode();
    const reportError = (
      node: TSESTree.Node,
      target: string,
      reason: string,
      suggestion?: string,
    ) => {
      context.report({
        messageId: 'ban',
        data: { target, reason, suggestion: suggestion || '暂无' },
        node,
      });
    };
    return {
      ImportDeclaration(node) {
        const moduleName = node.source.value as string;
        const importedSpecifierNames = node.specifiers
          .filter((sp) => Boolean((sp as TSESTree.ImportSpecifier).imported))
          .map((sp) => {
            const { imported } = sp as TSESTree.ImportSpecifier;
            return imported.name;
          });
        for (const pattern of banModules) {
          if (
            moduleName === pattern.moduleName ||
            (moduleName &&
              pattern.moduleName &&
              minimatch(moduleName, pattern.moduleName))
          ) {
            return reportError(
              node,
              moduleName,
              pattern.reason,
              pattern.suggestion,
            );
          }
        }

        Object.entries(banModulesWithSpecifiers)
          .filter(
            ([moduleNamePattern]) =>
              moduleName === moduleNamePattern ||
              (moduleName &&
                moduleNamePattern &&
                minimatch(moduleName, moduleNamePattern)),
          )
          .forEach(([, specifiersPatternList]) => {
            for (const specifierName of importedSpecifierNames) {
              for (const specifierPattern of specifiersPatternList) {
                if (
                  specifierName === specifierPattern.specifier ||
                  (specifierName &&
                    specifierPattern.specifier &&
                    minimatch(specifierName, specifierPattern.specifier))
                ) {
                  return reportError(
                    node,
                    `${moduleName} - ${specifierName}`,
                    specifierPattern.reason,
                    specifierPattern.suggestion,
                  );
                }
              }
            }
          });
      },
    };
  },
};

const rule = createRule(ruleModule);

export type RuleOptions = [
  {
    banModules: Array<{
      moduleName: string;
      reason: string;
      suggestion?: string;
    }>;
    banModulesWithSpecifiers: {
      [key: string]: Array<{
        specifier: string;
        reason: string;
        suggestion?: string;
      }>;
    };
  },
];

export { rule };
