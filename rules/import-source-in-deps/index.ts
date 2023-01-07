import * as fs from 'fs';
import * as path from 'path';

import { createRule } from '../../utils';

const packageJsonCache = new Map<string, string[]>();

export const rule = createRule({
  name: '@dalife/import-source-in-deps',
  meta: {
    hasSuggestions: true,
    docs: {
      description:
        'Module {{moduleName}} should be declared as the dependencies in package.json',
      // category: 'Possible Errors',
      recommended: 'error',
    },
    messages: {
      noDeps: 'Module {{moduleName}} is not declared as the dependencies in package.json',
    },
    type: 'problem',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const fileName = context.getFilename();
    const deps = scanNearestPackageJson(fileName, process.cwd());
    return {
      ImportDeclaration(node) {
        const name = node.source.value;
        if (typeof name === 'string' && !deps.includes(name)) {
          context.report({
            messageId: 'noDeps',
            node: node.source,
            data: { moduleName: name },
          });
        }
      },
    };
  },
});

function scanNearestPackageJson(fileName: string, root: string) {
  const tmpPath: string[] = fileName
    .split(path.sep)
    .map((_, i, arr) =>
      path.dirname(arr.slice(0, arr.length - i).join(path.sep)),
    )
    .filter((p) => !path.relative(root, p).startsWith('..'));

  const find = tmpPath.find((d) => packageJsonCache.get(d));
  if (find) {
    return find;
  }
  let pkgConfigDeps: string[] = [];
  let i = 0;
  for (; i < tmpPath.length; i++) {
    const pkgFileName = path.join(tmpPath[i], 'package.json');
    if (fs.existsSync(pkgFileName)) {
      pkgConfigDeps = Object.keys(require(pkgFileName).dependencies || {});

      // eslint-disable-next-line no-loop-func
      tmpPath.slice(0, i).forEach((p) => {
        packageJsonCache.set(p, pkgConfigDeps);
      });
      break;
    }
  }
  return pkgConfigDeps;
}
