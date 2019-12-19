import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { ProjectsTable } from '@console/internal/components/namespace';
import { PageHeading } from '@console/internal/components/utils';
import './ProjectListPage.scss';

export interface ProjectListPageProps {
  title: string;
  listComponent?: React.ComponentType<any>;
  children?: React.ReactNode;
  badge?: React.ReactNode;
}
const ProjectListPage: React.FC<ProjectListPageProps> = (props) => (
  <div className="odc-project-list-page">
    <PageHeading title={props.title} badge={props.badge}>
      {props.children}
    </PageHeading>
    <hr className="odc-project-list-page__section-border" />
    <ListPage
      {...props}
      showTitle={false}
      kind="Project"
      ListComponent={props.listComponent || ProjectsTable}
      canCreate={false}
      filterLabel="by name or display name"
      textFilter="project-name"
    />
  </div>
);

export default ProjectListPage;
