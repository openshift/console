import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { ErrorPage404 } from '@console/internal/components/error';
import { withStartGuide } from '@console/internal/components/start-guide';
import { LoadingBox } from '@console/internal/components/utils';
import { connectToPlural } from '@console/internal/kinds';
import {
  apiVersionForReference,
  isGroupVersionKind,
  K8sKind,
  kindForReference,
} from '@console/internal/module/k8s';
import { getBadgeFromType } from '@console/shared/src';
import CreateProjectListPage, { CreateAProjectButton } from './projects/CreateProjectListPage';

export interface ProjectSelectPageProps {
  kindObj?: K8sKind;
  kindsInFlight?: boolean;
}

const allParams = (props, params) => Object.assign({}, params, props);

const ProjectSelectPage: React.FC<ProjectSelectPageProps> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const { kindObj, kindsInFlight, plural } = allParams(props, params);

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
  const { labelPlural: projectLabelPlural } = kindObj;
  return (
    <>
      <Helmet>
        <title>{projectLabelPlural}</title>
      </Helmet>
      <CreateProjectListPage title={kindObj.labelPlural} badge={getBadgeFromType(kindObj.badge)}>
        {(openProjectModal) => (
          <Trans t={t} ns="devconsole" values={{ projectLabelPlural }}>
            Select a Project to view the list of {{ projectLabelPlural }}
            <CreateAProjectButton openProjectModal={openProjectModal} />.
          </Trans>
        )}
      </CreateProjectListPage>
    </>
  );
};

export default connectToPlural(withStartGuide(ProjectSelectPage));
