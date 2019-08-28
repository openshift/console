import * as React from 'react';
import { Helmet } from 'react-helmet';
import * as _ from 'lodash';
import { match as RMatch } from 'react-router';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { history } from '@console/internal/components/utils';
import { createProjectModal } from '@console/internal/components/modals';
import { ALL_APPLICATIONS_KEY } from '@console/internal/const';
import ODCEmptyState from './EmptyState';
import NamespacedPage from './NamespacedPage';
import DefaultPage from './DefaultPage';
import TopologyDataController, { RenderProps } from './topology/TopologyDataController';

export interface AddPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}
interface StateProps {
  activeApplication: string;
}

type props = AddPageProps & StateProps;

const openProjectModal = () =>
  createProjectModal({
    blocking: true,
    onSubmit: (project) => history.push(`/add/ns/${project.metadata.name}`),
  });

const renderEmptyState = ({ data, loaded }: RenderProps) => {
  return (
    <ODCEmptyState
      title="Add"
      {...(loaded
        ? _.isEmpty(data.graph.nodes)
          ? {
              hintBlockTitle: 'No workloads found',
              hintBlockDescription:
                'To add content to your project, create an application, component or service using one of these options.',
            }
          : {}
        : {})}
    />
  );
};

const AddPage: React.FC<props> = ({ match, activeApplication }) => {
  const namespace = match.params.ns;
  const application = activeApplication === ALL_APPLICATIONS_KEY ? undefined : activeApplication;
  return (
    <React.Fragment>
      <Helmet>
        <title>+Add</title>
      </Helmet>
      <NamespacedPage>
        {namespace ? (
          <TopologyDataController
            application={application}
            namespace={namespace}
            render={renderEmptyState}
          />
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
        )}
      </NamespacedPage>
    </React.Fragment>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    activeApplication: getActiveApplication(state),
  };
};

export default connect(mapStateToProps)(AddPage);
