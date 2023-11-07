import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { KebabAction, navFactory, viewYamlComponent } from '@console/internal/components/utils';
import { FirehoseResult, K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import * as SignedPipelinerunIcon from '../../images/signed-badge.svg';
import { PipelineRunModel } from '../../models';
import { PipelineRunKind } from '../../types';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { getPipelineRunKebabActions } from '../../utils/pipeline-actions';
import { pipelineRunStatus } from '../../utils/pipeline-filter-reducer';
import { chainsSignedAnnotation } from '../pipelines/const';
import { useDevPipelinesBreadcrumbsFor } from '../pipelines/hooks';
import { usePipelineOperatorVersion } from '../pipelines/utils/pipeline-operator';
import { useTaskRuns } from '../taskruns/useTaskRuns';
import { PipelineRunDetails } from './detail-page-tabs/PipelineRunDetails';
import { PipelineRunLogsWithActiveTask } from './detail-page-tabs/PipelineRunLogs';
import TaskRuns from './detail-page-tabs/TaskRuns';
import PipelineRunEvents from './events/PipelineRunEvents';
import { useTRPipelineRuns } from './hooks/useTektonResults';
import PipelineRunParametersForm from './PipelineRunParametersForm';
import { useMenuActionsWithUserAnnotation } from './triggered-by';

const PipelineRunDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const { kindObj, match, namespace, name } = props;
  const { t } = useTranslation();
  const [data, setData] = React.useState<FirehoseResult<K8sResourceKind> | PipelineRunKind>();
  const [loaded, setLoaded] = React.useState(false);
  const operatorVersion = usePipelineOperatorVersion(namespace);
  const [taskRuns] = useTaskRuns(namespace);
  const menuActions: KebabAction[] = useMenuActionsWithUserAnnotation(
    getPipelineRunKebabActions(operatorVersion, taskRuns, true),
  );
  const breadcrumbsFor = useDevPipelinesBreadcrumbsFor(kindObj, match);
  const badge = usePipelineTechPreviewBadge(props.namespace);
  const resourceTitleFunc = (obj: PipelineRunKind): string | JSX.Element =>
    obj?.metadata?.annotations?.[chainsSignedAnnotation] === 'true' ? (
      <div style={{ display: 'flex' }}>
        {obj?.metadata?.name}{' '}
        <Tooltip content={t('pipelines-plugin~Signed')}>
          <img src={SignedPipelinerunIcon} alt={t('pipelines-plugin~Signed')} />
        </Tooltip>
      </div>
    ) : (
      obj?.metadata?.name
    );

  const [pipelineRun, pipelineRunLoaded] = useK8sWatchResource<FirehoseResult<K8sResourceKind>>({
    kind: referenceForModel(PipelineRunModel),
    namespace,
    name,
    isList: false,
  });
  const [TRPlrs, TRPlrsLoaded] = useTRPipelineRuns(namespace, {
    selector: { filterByName: name },
  });

  React.useEffect(() => {
    setData(pipelineRun || TRPlrs[0]);
    setLoaded(pipelineRunLoaded || TRPlrsLoaded);
  }, [TRPlrs, pipelineRun, pipelineRunLoaded, TRPlrsLoaded]);

  return (
    <DetailsPage
      {...props}
      obj={{
        data,
        loaded,
        loadError: undefined,
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
          href: 'task-runs',
          // t('pipelines-plugin~TaskRuns')
          nameKey: 'pipelines-plugin~TaskRuns',
          component: TaskRuns,
        },
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
          path: 'logs/:name?',
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
