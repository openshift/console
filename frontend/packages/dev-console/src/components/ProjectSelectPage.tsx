import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { Helmet } from 'react-helmet';
import { useTranslation, Trans } from 'react-i18next';
import { match } from 'react-router';
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
import CreateProjectListPage from './projects/CreateProjectListPage';

export interface ProjectSelectPageProps {
  match: match<any>;
  kindObj?: K8sKind;
  kindsInFlight?: boolean;
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
  const { labelPlural: projectLabelPlural } = kindObj;
  return (
    <>
      <Helmet>
        <title>{projectLabelPlural}</title>
      </Helmet>
      <CreateProjectListPage title={kindObj.labelPlural} badge={getBadgeFromType(kindObj.badge)}>
        {(openProjectModal) => (
          <Trans t={t} ns="devconsole" values={{ projectLabelPlural }}>
            Select a Project to view the list of {{ projectLabelPlural }} or{' '}
            <Button isInline variant="link" onClick={openProjectModal}>
              create a Project
            </Button>
            .
          </Trans>
        )}
      </CreateProjectListPage>
    </>
  );
};

export default connectToPlural(withStartGuide(ProjectSelectPage));
