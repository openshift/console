import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { ProjectsTable } from '@console/internal/components/namespace';
import { PageHeading } from '@console/internal/components/utils';
import './DefaultPage.scss';

export interface DefaultPageProps {
  title: string;
  children?: React.ReactNode;
}
const DefaultPage: React.FC<DefaultPageProps> = (props) => (
  <div className="odc-default-page">
    <PageHeading title={props.title}>{props.children}</PageHeading>
    <hr className="odc-default-page__section-border" />
    <ListPage
      {...props}
      showTitle={false}
      kind="Project"
      ListComponent={ProjectsTable}
      canCreate={false}
    />
  </div>
);

export default DefaultPage;
