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
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import { WrenchIcon } from '@patternfly/react-icons/dist/esm/icons/wrench-icon';
import { useTranslation } from 'react-i18next';
import { QuickStartModel } from '@console/app/src/models';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import { getReferenceForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';

const QUICK_START_DOCS_URL =
  'https://docs.redhat.com/en/documentation/openshift_container_platform/latest/html/web_console/creating-quick-start-tutorials';

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
                  {t('Create {{kind}}', { kind: QuickStartModel.kind })}
                </Button>
                <Button
                  variant="link"
                  target="_blank"
                  rel="noopener noreferrer"
                  component="a"
                  href={QUICK_START_DOCS_URL}
                  iconPosition="right"
                  icon={<ExternalLinkAltIcon />}
                >
                  {t('Learn more about quick starts')}
                </Button>
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
