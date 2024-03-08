import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { Table } from '@console/internal/components/factory';
import { useUserSettings } from '@console/shared/src';
import { PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY } from '../../../const';
import { PipelineRunModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
import { usePipelineOperatorVersion } from '../../pipelines/utils/pipeline-operator';
import { getPipelineRunVulnerabilities } from '../hooks/usePipelineRunVulnerabilities';
import { useGetTaskRuns } from '../hooks/useTektonResults';
import PipelineRunHeader from './PipelineRunHeader';
import PipelineRunRow from './PipelineRunRow';

import './PipelineRunList.scss';

type PipelineRunListProps = {
  namespace: string;
  loaded?: boolean;
  data?: PipelineRunKind[];
  customData?: any;
};

export const PipelineRunList: React.FC<PipelineRunListProps> = (props) => {
  const { t } = useTranslation();
  const { namespace, loaded, data, customData } = props;
  const operatorVersion = usePipelineOperatorVersion(namespace);
  const activePerspective = useActivePerspective()[0];
  const [, setPreferredTab, preferredTabLoaded] = useUserSettings<string>(
    PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY,
    'pipelines',
  );
  const [taskRuns, taskRunsLoaded] = useGetTaskRuns(namespace);
  React.useEffect(() => {
    if (preferredTabLoaded && activePerspective === 'dev') {
      setPreferredTab('pipeline-runs');
    }
  }, [activePerspective, preferredTabLoaded, setPreferredTab]);

  const onRowsRendered = ({ stopIndex }) => {
    if (loaded && stopIndex === data.length - 1) {
      customData?.nextPage?.();
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~PipelineRuns')}</title>
      </Helmet>
      <Table
        {...props}
        aria-label={t(PipelineRunModel.labelPluralKey)}
        defaultSortField="status.startTime"
        defaultSortOrder={SortByDirection.desc}
        Header={PipelineRunHeader}
        Row={PipelineRunRow}
        customSorts={{
          vulnerabilities: (obj: PipelineRunKind) => {
            const scanResults = getPipelineRunVulnerabilities(obj);
            if (!scanResults?.vulnerabilities) {
              return -1;
            }
            // Expect no more than 999 of any one severity
            return (
              (scanResults.vulnerabilities.critical ?? 0) * 1000000000 +
              (scanResults.vulnerabilities.high ?? 0) * 1000000 +
              (scanResults.vulnerabilities.medium ?? 0) * 1000 +
              (scanResults.vulnerabilities.low ?? 0)
            );
          },
        }}
        customData={{ operatorVersion, taskRuns: taskRunsLoaded ? taskRuns : [], taskRunsLoaded }}
        onRowsRendered={onRowsRendered}
        virtualize
      />
    </>
  );
};

export default PipelineRunList;
