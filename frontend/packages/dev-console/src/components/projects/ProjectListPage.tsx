import type { ComponentType, ReactNode } from 'react';
import { ListPage } from '@console/internal/components/factory';
import { ProjectsTable } from '@console/internal/components/namespace';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import './ProjectListPage.scss';

export type ProjectListPageProps = {
  title: string;
  listComponent?: ComponentType<any>;
  badge?: ReactNode;
  helpText?: ReactNode;
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
      omitFilterToolbar
    />
  </div>
);

export default ProjectListPage;
