import * as React from 'react';
import { Helmet } from 'react-helmet';
import { match } from 'react-router';
import { LoadingBox } from '@console/internal/components/utils';
import { connectToPlural } from '@console/internal/kinds';
import {
  apiVersionForReference,
  isGroupVersionKind,
  kindForReference,
} from '@console/internal/module/k8s';
import { ErrorPage404 } from '@console/internal/components/error';
import { withStartGuide } from '@console/internal/components/start-guide';
import ProjectListPage from './projects/ProjectListPage';
import { getBadgeFromType } from '@console/shared/src';

export interface ProjectSelectPageProps {
  match: match<any>;
}

const allParams = (props) => Object.assign({}, props?.match?.params, props);

const ProjectSelectPage: React.FC<ProjectSelectPageProps> = (props) => {
  const { kindObj, kindsInFlight, plural } = allParams(props);

  if (!kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    const missingType = isGroupVersionKind(plural)
      ? `"${kindForReference(plural)}" in "${apiVersionForReference(plural)}"`
      : `"${plural}"`;
    return (
      <ErrorPage404
        message={`The server doesn't have a resource type ${missingType}. Try refreshing the page if it was recently added.`}
      />
    );
  }
  return (
    <>
      <Helmet>
        <title>{kindObj.labelPlural}</title>
      </Helmet>
      <ProjectListPage title={kindObj.labelPlural} badge={getBadgeFromType(kindObj.badge)}>
        Select a project to view the list of {kindObj.labelPlural}
      </ProjectListPage>
    </>
  );
};

export default connectToPlural(withStartGuide(ProjectSelectPage));
