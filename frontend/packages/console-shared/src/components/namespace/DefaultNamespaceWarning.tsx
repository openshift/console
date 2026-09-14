import { IconStatus, Status } from '@patternfly/react-component-groups/dist/dynamic/Status';
import { Alert, AlertVariant, Content, Label, PageSection, Tooltip } from '@patternfly/react-core';
import { RhUiWarningFillIcon } from '@patternfly/react-icons';
import { Trans, useTranslation } from 'react-i18next';
import {
  documentationURLs,
  getDocumentationURL,
} from '@console/internal/components/utils/documentation';
import { ProjectModel } from '@console/internal/models';
import { useActiveNamespace } from '../../hooks/useActiveNamespace';
import { useConsoleSelector } from '../../hooks/useConsoleSelector';
import { ExternalLink } from '../links/ExternalLink';
import { isSystemNamespace } from './filters';

interface DefaultNamespaceWarningProps {
  isProject?: boolean;
}

interface NamespacedWarningProps {
  namespace?: string;
  namespaces?: string[];
}

interface DefaultNamespaceDeploymentWarningProps extends DefaultNamespaceWarningProps {
  namespace?: string;
}

const isUserNamespace = (namespace: unknown) =>
  !isSystemNamespace({ title: typeof namespace === 'string' ? namespace : '' });

/**
 * Used in the namespace selector to display a "default" label next to system namespaces and projects.
 */
export const DefaultNamespaceLabel: React.FC<DefaultNamespaceDeploymentWarningProps> = ({
  isProject,
  namespace,
}) => {
  const { t } = useTranslation('console-shared');

  if (isUserNamespace(namespace)) {
    return null;
  }

  const tooltipContent = isProject ? (
    <Trans t={t} ns="console-shared">
      This is a default project. Deploying workloads here bypasses Security Context Constraints (
      <abbr>SCCs</abbr>), significantly reducing security protections.
    </Trans>
  ) : (
    <Trans t={t} ns="console-shared">
      This is a default namespace. Deploying workloads here bypasses Security Context Constraints (
      <abbr>SCCs</abbr>), significantly reducing security protections.
    </Trans>
  );

  return (
    <Tooltip content={tooltipContent} position="top">
      <Label
        isCompact
        variant="outline"
        className="pf-v6-u-ml-sm"
        data-test="default-namespace-label"
      >
        {t('Default')}
      </Label>
    </Tooltip>
  );
};

/**
 * Placed under the "submit" button on deployment forms to warn users that they are
 * deploying to a default namespace or project.
 */
export const DefaultNamespaceDeploymentWarning: React.FC<NamespacedWarningProps> = ({
  namespace = '',
  namespaces = [],
}) => {
  const { t } = useTranslation('console-shared');

  const isProject = useConsoleSelector<boolean>(
    ({ k8s }) => !!k8s.RESOURCES?.models?.[ProjectModel.kind],
  );

  if (isUserNamespace(namespace) && namespaces.every((ns) => isUserNamespace(ns))) {
    return null;
  }

  const warningMessage = isProject
    ? t(
        'The target project bypasses Security Context Constraints (SCCs). Deploying workloads here significantly reduces security protections.',
      )
    : t(
        'The target namespace bypasses Security Context Constraints (SCCs). Deploying workloads here significantly reduces security protections.',
      );

  return (
    <div className="pf-v6-u-mt-sm" data-test="default-namespace-deployment-warning">
      <Status label={warningMessage} status={IconStatus.warning} icon={<RhUiWarningFillIcon />} />
    </div>
  );
};

/**
 * Placed under the namespace bar to display a warning
 */
export const DefaultNamespaceWarning: React.FC<DefaultNamespaceWarningProps> = ({ isProject }) => {
  const { t } = useTranslation('console-shared');
  const [namespace] = useActiveNamespace();

  if (isUserNamespace(namespace)) {
    return null;
  }

  const warningTitle = isProject
    ? t('Security warning: You are in a default project')
    : t('Security warning: You are in a default namespace');

  return (
    <PageSection>
      {' '}
      <Alert
        variant={AlertVariant.warning}
        title={warningTitle}
        ouiaId="DefaultNamespaceWarningAlert"
        data-test="default-namespace-warning-alert"
      >
        <Content component="p">
          <Trans t={t} ns="console-shared">
            Deploying workloads here bypasses Security Context Constraints (<abbr>SCCs</abbr>),
            significantly reducing security protections.{' '}
            <ExternalLink href={getDocumentationURL(documentationURLs.securityContextConstraints)}>
              Learn more about SCCs
            </ExternalLink>
          </Trans>
        </Content>
      </Alert>
    </PageSection>
  );
};
