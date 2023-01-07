import { ruleModule } from '../ban-module-import';
import { createRule } from '../../utils';

const rule = createRule({
  ...ruleModule,
  name: '@dalife/ban-module-import-warn',
});

export { rule };
