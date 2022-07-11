import * as React from 'react';
import { Divider } from '@patternfly/react-core';
import { ProjectListPageProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { ListPage } from '@console/internal/components/factory';
import { ProjectsTable } from '@console/internal/components/namespace';
import { PageHeading } from '@console/internal/components/utils';
import './ProjectListPage.scss';

const ProjectListPage: React.FC<ProjectListPageProps> = ({
  badge,
  title,
  children,
  listComponent,
  ...listPageProps
}) => (
  <div className="odc-project-list-page">
    <PageHeading title={title} badge={badge}>
      {children}
    </PageHeading>
    <Divider className="co-divider" />
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
