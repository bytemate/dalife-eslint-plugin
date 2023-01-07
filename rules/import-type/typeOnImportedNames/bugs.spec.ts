import { rule } from '../';
import { test } from '../../../utils';
import { options } from './options';

describe('import-type', () => {
  const ruleTester = test.getRuleTester();
  ruleTester.run('@dalife/import-type', rule, {
    valid: [
      {
        options,
        code: `
          import { Playback } from '@dalife/room';
          export default class TeacherRoom extends React.Component<IProps, IState> {
            private playback: Playback | undefined;
          }
          this.playback = new Playback({
            appId: APP_ID,
          });
        `,
      },
      {
        options,
        code: `
          import { ActivityEditStepName } from '@/common/constants/activity';
          import { type ActivityId } from '@/common/constants/activity';
          const stepsInfo = [
            {
              index: 1,
              name: ActivityEditStepName.Base,
              title: 'Basic Info',
              description: 'Basic Info',
            },
            {
              index: 2,
              name: ActivityEditStepName.Reward,
              title: 'Reward settings',
              description: 'Reward settings',
            },
            {
              index: 3,
              name: ActivityEditStepName.Budget,
              title: 'Budget settings',
              description: 'Budget settings',
            },
          ];
          const stepIndexMap = new Map<ActivityEditStepName, number>(
            stepsInfo.map((step) => [step.name, step.index]),
          );
        `,
      },
      {
        code: `
          enum UploadType {
            WorkbookList = 'workbookList',
            ExaminationPaperList = 'examinationPaperList'
          }
        `,
      },
      {
        code: `
          import { Button } from 'antd';
          import { type ButtonProps } from 'antd/lib/button';
          export default function LinkBtn(props: ButtonProps) {
            return <Button {...props} type="link" />;
          }
        `,
      },
      {
        code: `
        import { rule } from '.';
        import { getRuleTester } from '../../test-utils';
        describe('import-type', () => {
          const ruleTester: getRuleTester = getRuleTester();
          ruleTester.run('@dalife/import-type', rule, {})
        });
        `,
      },
      {
        code: `
        import { type TableProps } from 'antd/lib/table';
        interface PropsType extends TableProps<any> {
        }
        `,
      },
    ],
    invalid: [
      {
        options,
        // defaultImport 的 fix问题
        code: `
          import activityModel, { FetchActivityListParams } from '@/models/activity';
          const [activityState, activityActions] = useLocalModel(activityModel);
          const fetchList = (options?: FetchActivityListParams) => {
            const queryParams: FetchActivityListParams = {
              pageNo: pageInfo.page - 1,
              pageSize: pageInfo.pageSize,
              ...options,
            };
            return activityActions.fetchList(queryParams);
          };
        `,
        output: `
          import activityModel, { type FetchActivityListParams } from '@/models/activity';
          const [activityState, activityActions] = useLocalModel(activityModel);
          const fetchList = (options?: FetchActivityListParams) => {
            const queryParams: FetchActivityListParams = {
              pageNo: pageInfo.page - 1,
              pageSize: pageInfo.pageSize,
              ...options,
            };
            return activityActions.fetchList(queryParams);
          };
        `,
        errors: [{ messageId: 'importsUsedAsType' }],
      },
      {
        options,
        code: `
          import { ColumnType } from 'antd/lib/table';
          import { QueryParams } from '..';

          const columns: ColumnType<QueryParams>[] = [];
        `,
        output: `
          import { type ColumnType } from 'antd/lib/table';
          import { type QueryParams } from '..';

          const columns: ColumnType<QueryParams>[] = [];
        `,
        errors: [
          { messageId: 'importsUsedAsType' },
          { messageId: 'importsUsedAsType' },
        ],
      },
    ],

  });
});
