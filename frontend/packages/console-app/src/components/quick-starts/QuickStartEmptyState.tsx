import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
  EmptyStateVariant,
  Skeleton,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import { WrenchIcon } from '@patternfly/react-icons/dist/esm/icons/wrench-icon';
import { useTranslation } from 'react-i18next';
import { QuickStartModel } from '@console/app/src/models';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import { getReferenceForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import {
  documentationURLs,
  getDocumentationURL,
} from '@console/internal/components/utils/documentation';
import { ExternalLinkButton } from '@console/shared/src/components/links/ExternalLinkButton';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';

export const QuickStartEmptyState = () => {
  const { t } = useTranslation('console-app');

  const [canAddQuickStarts, loading] = useAccessReview({
    group: QuickStartModel.apiGroup,
    resource: QuickStartModel.kind,
    verb: 'create',
  });

  return (
    <EmptyState
      titleText={t('No {{label}} found', { label: QuickStartModel.labelPlural })}
      headingLevel="h4"
      icon={loading ? Skeleton : canAddQuickStarts ? WrenchIcon : CubesIcon}
      variant={EmptyStateVariant.lg}
    >
      {!loading ? (
        <>
          <EmptyStateBody>
            {canAddQuickStarts
              ? t('Configure quick starts to help users get started with the cluster.')
              : t('Ask a cluster administrator to configure quick starts.')}
          </EmptyStateBody>
          {canAddQuickStarts && (
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button
                  variant="primary"
                  component={LinkTo('/cluster-configuration#quick-starts-configuration')}
                >
                  {t('Configure quick starts')}
                </Button>
              </EmptyStateActions>
              <EmptyStateActions>
                <Button
                  variant="link"
                  component={LinkTo(`/k8s/cluster/${getReferenceForModel(QuickStartModel)}/~new`)}
                >
                  {t('Create {{label}}', { label: t(QuickStartModel.labelKey) })}
                </Button>
                <ExternalLinkButton
                  variant="link"
                  href={getDocumentationURL(documentationURLs.creatingQuickStartsTutorials)}
                >
                  {t('Learn more about quick starts')}
                </ExternalLinkButton>
              </EmptyStateActions>
            </EmptyStateFooter>
          )}
        </>
      ) : (
        <EmptyStateBody>
          <Skeleton />
        </EmptyStateBody>
      )}
    </EmptyState>
  );
};
