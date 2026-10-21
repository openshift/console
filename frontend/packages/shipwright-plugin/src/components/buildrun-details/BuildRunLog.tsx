import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { PodModel } from '@console/internal/models';
import type { TaskRunKind } from '../../types';
import LogsWrapperComponent from '../logs/LogsWrapperComponent';
import { TektonResourceLabel } from '../logs/TektonTaskRunLog';

import './BuildRunLog.scss';

export type TaskRunLogProps = {
  obj: TaskRunKind;
};

const BuildRunLog: FC<TaskRunLogProps> = ({ obj }) => {
  const { t } = useTranslation();
  if (obj?.status?.podName) {
    const podResources = {
      kind: PodModel.kind,
      isList: false,
      prop: `obj`,
      namespace: obj.metadata?.namespace || '',
      name: obj.status.podName,
    };
    return (
      <div className="sw-build-run-log">
        <LogsWrapperComponent
          taskRun={obj}
          taskName={obj?.metadata?.labels?.[TektonResourceLabel.pipelineTask] || ''}
          resource={podResources}
          downloadAllLabel={t('shipwright-plugin~Download all TaskRun logs')}
        />
      </div>
    );
  }
  return (
    <StatusBox
      label={t('shipwright-plugin~TaskRun log')}
      loadError={new Error(t('shipwright-plugin~Pod not found'))}
    />
  );
};

export default BuildRunLog;
