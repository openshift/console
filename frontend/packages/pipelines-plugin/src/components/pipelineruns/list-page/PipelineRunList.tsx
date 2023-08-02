import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { Table } from '@console/internal/components/factory';
import { useUserSettings } from '@console/shared/src';
import { PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY } from '../../../const';
import { PipelineRunModel } from '../../../models';
import { usePipelineOperatorVersion } from '../../pipelines/utils/pipeline-operator';
import { useTaskRuns } from '../../taskruns/useTaskRuns';
import PipelineRunHeader from './PipelineRunHeader';
import PipelineRunRow from './PipelineRunRow';

type PipelineRunListProps = {
  namespace: string;
};

export const PipelineRunList: React.FC<PipelineRunListProps> = (props) => {
  const { t } = useTranslation();
  const operatorVersion = usePipelineOperatorVersion(props.namespace);
  const activePerspective = useActivePerspective()[0];
  const [, setPreferredTab, preferredTabLoaded] = useUserSettings<string>(
    PREFERRED_DEV_PIPELINE_PAGE_TAB_USER_SETTING_KEY,
    'pipelines',
  );
  const [taskRuns, taskRunsLoaded] = useTaskRuns(props.namespace);

  React.useEffect(() => {
    if (preferredTabLoaded && activePerspective === 'dev') {
      setPreferredTab('pipeline-runs');
    }
  }, [activePerspective, preferredTabLoaded, setPreferredTab]);

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
        customData={{ operatorVersion, taskRuns: taskRunsLoaded ? taskRuns : [] }}
        virtualize
      />
    </>
  );
};

export default PipelineRunList;
