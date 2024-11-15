import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { ArchiveIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { KebabAction, navFactory, viewYamlComponent } from '@console/internal/components/utils';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
} from '../../const';
import SignedPipelinerunIcon from '../../images/signed-badge.svg';
import { PipelineRunKind } from '../../types';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { getPipelineRunKebabActions } from '../../utils/pipeline-actions';
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import { chainsSignedAnnotation } from '../pipelines/const';
import { useDevPipelinesBreadcrumbsFor } from '../pipelines/hooks';
import { usePipelineOperatorVersion } from '../pipelines/utils/pipeline-operator';
import { PipelineRunDetails } from './detail-page-tabs/PipelineRunDetails';
import { PipelineRunLogsWithActiveTask } from './detail-page-tabs/PipelineRunLogs';
import PipelineRunEvents from './events/PipelineRunEvents';
import { usePipelineRun } from './hooks/usePipelineRuns';
import { useTaskRuns } from './hooks/useTaskRuns';
import PipelineRunParametersForm from './PipelineRunParametersForm';
import { useMenuActionsWithUserAnnotation } from './triggered-by';

import './PipelineRunDetailsPage.scss';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, namespace, name } = props;
  const { t } = useTranslation();
  const operatorVersion = usePipelineOperatorVersion(namespace);
  const [taskRuns] = useTaskRuns(namespace, name);
  const menuActions: KebabAction[] = useMenuActionsWithUserAnnotation(
    getPipelineRunKebabActions(operatorVersion, taskRuns, true),
  );
  const breadcrumbsFor = useDevPipelinesBreadcrumbsFor(kindObj);
  const badge = usePipelineTechPreviewBadge(props.namespace);
  const resourceTitleFunc = (obj: PipelineRunKind): string | JSX.Element => {
    return (
      <div className="pipelinerun-details-page">
        {obj?.metadata?.name}{' '}
        {obj?.metadata?.annotations?.[chainsSignedAnnotation] === 'true' && (
          <Tooltip content={t('pipelines-plugin~Signed')}>
            <img src={SignedPipelinerunIcon} alt={t('pipelines-plugin~Signed')} />
          </Tooltip>
        )}
        {(obj?.metadata?.annotations?.[DELETED_RESOURCE_IN_K8S_ANNOTATION] === 'true' ||
          obj?.metadata?.annotations?.[RESOURCE_LOADED_FROM_RESULTS_ANNOTATION] === 'true') && (
          <Tooltip content={t('pipelines-plugin~Archived in Tekton results')}>
            <ArchiveIcon className="pipelinerun-details-page__results-indicator" />
          </Tooltip>
        )}
      </div>
    );
  };

  const [pipelineRun, loaded, error] = usePipelineRun(namespace, name);

  return (
    <DetailsPage
      {...props}
      obj={{
        data: pipelineRun,
        loaded,
        loadError: error,
      }}
      badge={badge}
      menuActions={menuActions}
      getResourceStatus={pipelineRunStatus}
      breadcrumbsFor={() => breadcrumbsFor}
      titleFunc={resourceTitleFunc}
      pages={[
        navFactory.details(PipelineRunDetails),
        navFactory.editYaml(viewYamlComponent),
        {
          href: 'parameters',
          // t('pipelines-plugin~Parameters')
          nameKey: 'pipelines-plugin~Parameters',
          component: (pageProps) => (
            <PipelineRunParametersForm obj={pageProps.obj} {...pageProps} />
          ),
        },
        {
          href: 'logs',
          // t('pipelines-plugin~Logs')
          nameKey: 'pipelines-plugin~Logs',
          component: PipelineRunLogsWithActiveTask,
        },
        navFactory.events(PipelineRunEvents),
      ]}
    />
  );
};

export default PipelineRunDetailsPage;
