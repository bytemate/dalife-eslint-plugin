import { rule } from '.';
import { getRuleTester } from '../../utils/test';

import type { RuleTester } from 'eslint';

describe('ban-module-import', () => {
  const options: RuleTester.ValidTestCase['options'] = [
    {
      banModules: [
        {
          moduleName: 'history',
          reason: 'some reason',
        },
        {
          moduleName: '@dalife/*_node',
          reason: 'other reason',
          suggestion: 'use bar instead',
        },
      ],
      banModulesWithSpecifiers: {
        '@dalife/cloud': [
          {
            specifier: 'TunnelService',
            reason: 'tunnel reason',
          },
        ],
      },
    },
  ];
  const ruleTester = getRuleTester();
  ruleTester.run('@dalife/ban-module-import', rule, {
    valid: [
      { options, code: `import * as h from '@/history';` },
      { options, code: `import { someOthers } from '@dalife/cloud';` },
      { options, code: `import { someOthers } from '@dalife/cloud-tunnel';` },
      {
        options,
        code: `import { TunnelService } from '@dalife/cloud-tunnel';`,
      },
    ],
    invalid: [
      {
        options,
        code: `import * as h from 'history';`,
        errors: [{ messageId: 'ban' }],
      },
      {
        options,
        code: `import { a, b } from '@dalife/admin_node';`,
        errors: [{ messageId: 'ban' }],
      },
      {
        options,
        code: `import { a as c, b } from '@dalife/admin_node';`,
        errors: [{ messageId: 'ban' }],
      },
      {
        options,
        code: `import { TunnelService } from '@dalife/cloud';`,
        errors: [{ messageId: 'ban' }],
      },
      {
        options,
        code: `import { TunnelService as MyService } from '@dalife/cloud';`,
        errors: [{ messageId: 'ban' }],
      },
    ],
  });
});
