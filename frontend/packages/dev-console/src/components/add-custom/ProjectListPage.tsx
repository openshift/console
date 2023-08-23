import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { ProjectsTable } from '@console/internal/components/namespace';
import { PageHeading } from '@console/internal/components/utils';
import './ProjectListPage.scss';

export type ProjectListPageProps = {
  title: string;
  listComponent?: React.ComponentType<any>;
  children?: React.ReactNode;
  badge?: React.ReactNode;
};
const ProjectListPage: React.FC<ProjectListPageProps> = ({
  badge,
  title,
  children,
  listComponent,
  ...listPageProps
}) => (
  <div className="odc-add-custom-list-page">
    <PageHeading title={title} badge={badge}>
      {children}
    </PageHeading>
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
