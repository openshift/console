import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
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
import CreateProjectListPage from './projects/CreateProjectListPage';
import { getBadgeFromType } from '@console/shared/src';

export interface ProjectSelectPageProps {
  match: match<any>;
}

const allParams = (props) => Object.assign({}, props?.match?.params, props);

const ProjectSelectPage: React.FC<ProjectSelectPageProps> = (props) => {
  const { t } = useTranslation();
  const { kindObj, kindsInFlight, plural } = allParams(props);

  if (!kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    const missingType = isGroupVersionKind(plural)
      ? t('devconsole~{{kindForRefPlural}} in {{apiVersionForRefPlural}}', {
          kindForRefPlural: kindForReference(plural),
          apiVersionForRefPlural: apiVersionForReference(plural),
        })
      : `"${plural}"`;
    return (
      <ErrorPage404
        message={t(
          "devconsole~The server doesn't have a resource type {{missingType}}. Try refreshing the page if it was recently added.",
          { missingType },
        )}
      />
    );
  }
  return (
    <>
      <Helmet>
        <title>{kindObj.labelPlural}</title>
      </Helmet>
      <CreateProjectListPage title={kindObj.labelPlural} badge={getBadgeFromType(kindObj.badge)}>
        {t('devconsole~Select a project to view the list of {{projectLabelPlural}}', {
          projectLabelPlural: kindObj.labelPlural,
        })}
      </CreateProjectListPage>
    </>
  );
};

export default connectToPlural(withStartGuide(ProjectSelectPage));
