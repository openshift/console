import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResourceLog,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
  LOG_SOURCE_WAITING,
} from './utils/resource-log';
import { ConsoleEmptyState } from '@console/shared/src/components/empty-state';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { getJenkinsLogURL, BuildPipelineLogLink } from './build-pipeline';
import { BuildStrategyType } from './utils/build-utils';
import { BuildPhase } from '../module/k8s/builds';
import { PageComponentProps } from './utils/horizontal-nav';
import { K8sResourceKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

const PipelineLogMessage: Snail.FCC<{
  build: K8sResourceKind;
}> = ({ build }) => {
  const { t } = useTranslation();
  const logURL = getJenkinsLogURL(build);
  const message = logURL
    ? t('public~Pipeline build logs are available through Jenkins (linked below)')
    : t('public~A link to the Jenkins pipeline build logs will appear below when the build starts');

  const detail = (
    <>
      <p>{message}</p>
      <BuildPipelineLogLink obj={build} />
    </>
  );

  return <ConsoleEmptyState title={t('public~See Jenkins log')}>{detail}</ConsoleEmptyState>;
};

const buildPhaseToLogSourceStatus = (phase: BuildPhase) => {
  switch (phase) {
    case BuildPhase.New:
    case BuildPhase.Pending:
      return LOG_SOURCE_WAITING;

    case BuildPhase.Cancelled:
    case BuildPhase.Complete:
    case BuildPhase.Error:
    case BuildPhase.Failed:
      return LOG_SOURCE_TERMINATED;

    default:
      return LOG_SOURCE_RUNNING;
  }
};

export const BuildLogs: Snail.FCC<PageComponentProps> = ({ obj: build }) => {
  const phase = _.get(build, 'status.phase');
  const status = buildPhaseToLogSourceStatus(phase);

  return (
    <PaneBody fullHeight>
      {_.get(build, 'spec.strategy.type') === BuildStrategyType.JenkinsPipeline ? (
        <PipelineLogMessage build={build} />
      ) : (
        <ResourceLog resource={build} resourceStatus={status} />
      )}
    </PaneBody>
  );
};
