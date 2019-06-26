import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match as RMatch } from 'react-router';
import { history } from '@console/internal/components/utils';
import { createProjectModal } from '@console/internal/components/modals';
import ODCEmptyState from './EmptyState';
import NamespacedPage from './NamespacedPage';
import DefaultPage from './DefaultPage';

export interface AddPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}
const openProjectModal = () =>
  createProjectModal({
    blocking: true,
    onSubmit: (project) => history.push(`/add/ns/${project.metadata.name}`),
  });
const AddPage: React.FC<AddPageProps> = ({ match }) => {
  const namespace = match.params.ns;
  return (
    <React.Fragment>
      <Helmet>
        <title>+Add</title>
      </Helmet>
      <NamespacedPage>
        {namespace ? (
          <ODCEmptyState title="Add" />
        ) : (
          <DefaultPage title="Add">
            Select a project to start adding to it or{' '}
            <button
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

export default AddPage;
