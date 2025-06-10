import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { ProjectsTable } from '@console/internal/components/namespace';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import './ProjectListPage.scss';

export type ProjectListPageProps = {
  title: string;
  listComponent?: React.ComponentType<any>;
  badge?: React.ReactNode;
  helpText?: React.ReactNode;
};
const ProjectListPage: React.FCC<ProjectListPageProps> = ({
  badge,
  title,
  listComponent,
  helpText,
  ...listPageProps
}) => (
  <div className="odc-project-list-page">
    <PageHeading title={title} badge={badge} helpText={helpText} />
    <ListPage
      {...listPageProps}
      showTitle={false}
      kind="Project"
      ListComponent={listComponent || ProjectsTable}
      canCreate={false}
      filterLabel="by name or display name"
      textFilter="project-name"
    />
  </div>
);

export default ProjectListPage;
