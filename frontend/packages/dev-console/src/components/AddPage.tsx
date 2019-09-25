import * as React from 'react';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { history, Firehose, FirehoseResource, HintBlock } from '@console/internal/components/utils';
import { createProjectModal } from '@console/internal/components/modals';
import { K8sResourceKind } from '@console/internal/module/k8s';
import ODCEmptyState from './EmptyState';
import NamespacedPage from './NamespacedPage';
import ProjectsExistWrapper from './ProjectsExistWrapper';
import DefaultPage from './DefaultPage';

export interface AddPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

interface ResourcesType {
  deploymentConfigs: K8sResourceKind;
  deployments: K8sResourceKind;
  daemonSets: K8sResourceKind;
  statefulSets: K8sResourceKind;
}
interface EmptyStateLoaderProps {
  resources?: ResourcesType;
  loaded?: boolean;
  loadError?: string;
}

const openProjectModal = () =>
  createProjectModal({
    blocking: true,
    onSubmit: (project) => history.push(`/add/ns/${project.metadata.name}`),
  });

const EmptyStateLoader: React.FC<EmptyStateLoaderProps> = ({ resources, loaded, loadError }) => {
  const [noWorkloads, setNoWorkloads] = React.useState(false);

  React.useEffect(() => {
    if (loaded) {
      setNoWorkloads(
        _.isEmpty(resources.deploymentConfigs.data) &&
          _.isEmpty(resources.deployments.data) &&
          _.isEmpty(resources.daemonSets.data) &&
          _.isEmpty(resources.statefulSets.data),
      );
    } else if (loadError) {
      setNoWorkloads(false);
    }
  }, [
    loadError,
    loaded,
    resources.daemonSets.data,
    resources.deploymentConfigs.data,
    resources.deployments.data,
    resources.statefulSets.data,
  ]);
  return noWorkloads ? (
    <ODCEmptyState
      title="Add"
      hintBlock={
        <HintBlock title="No workloads found">
          <p>
            To add content to your project, create an application, component or service using one of
            these options.
          </p>
        </HintBlock>
      }
    />
  ) : (
    <ODCEmptyState title="Add" />
  );
};

const RenderEmptyState = ({ namespace }) => {
  const resources: FirehoseResource[] = [
    {
      isList: true,
      kind: 'DeploymentConfig',
      namespace,
      prop: 'deploymentConfigs',
    },
    {
      isList: true,
      kind: 'Deployment',
      namespace,
      prop: 'deployments',
    },
    {
      isList: true,
      kind: 'DaemonSet',
      namespace,
      prop: 'daemonSets',
    },
    {
      isList: true,
      kind: 'StatefulSet',
      namespace,
      prop: 'statefulSets',
    },
  ];
  return (
    <Firehose resources={resources}>
      <EmptyStateLoader />
    </Firehose>
  );
};

const AddPage: React.FC<AddPageProps> = ({ match }) => {
  const namespace = match.params.ns;

  return (
    <React.Fragment>
      <Helmet>
        <title>+Add</title>
      </Helmet>
      <NamespacedPage>
        <Firehose resources={[{ kind: 'Project', prop: 'projects', isList: true }]}>
          <ProjectsExistWrapper title="Add">
            {() =>
              namespace ? (
                <RenderEmptyState namespace={namespace} />
              ) : (
                <DefaultPage title="Add">
                  Select a project to start adding to it or{' '}
                  <button
                    style={{ verticalAlign: 'baseline' }}
                    type="button"
                    className="btn btn-link btn-link--no-btn-default-values"
                    onClick={openProjectModal}
                  >
                    create a project
                  </button>
                </DefaultPage>
              )
            }
          </ProjectsExistWrapper>
        </Firehose>
      </NamespacedPage>
    </React.Fragment>
  );
};

export default AddPage;
