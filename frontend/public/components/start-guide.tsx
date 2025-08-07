import * as _ from 'lodash-es';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { Button, ButtonVariant, Divider, EmptyStateVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { FLAGS } from '@console/shared/src/constants';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { Disabled, openshiftHelpBase, LinkifyExternal, ConsoleEmptyState } from './utils';
import { ProjectModel } from '../models';
import { K8sResourceKind } from '../module/k8s/types';
import { useCreateNamespaceOrProjectModal } from '@console/shared/src/hooks/useCreateNamespaceOrProjectModal';
import { RootState } from '../redux';
import { useFlag } from '@console/shared/src';
import { ClusterIcon } from '@patternfly/react-icons/dist/esm/icons/cluster-icon';
import { ExternalLinkButton } from '@console/shared/src/components/links/ExternalLinkButton';

export const OpenShiftGettingStarted: React.FCC<OpenShiftGettingStartedProps> = () => {
  const { t } = useTranslation();
  const [, setActiveNamespace] = useActiveNamespace();
  const [perspective] = useActivePerspective();
  const canCreateNamespace = useFlag(FLAGS.CAN_CREATE_NS);
  const canCreateProject = useFlag(FLAGS.CAN_CREATE_PROJECT);
  const canCreate = canCreateNamespace || canCreateProject;
  const createProjectMessage = useSelector(({ UI }: RootState) => UI.get('createProjectMessage'));
  const createNamespaceOrProjectModal = useCreateNamespaceOrProjectModal();
  const onClickCreate = () =>
    createNamespaceOrProjectModal({
      onSubmit:
        perspective !== 'admin'
          ? (project: K8sResourceKind) => {
              setActiveNamespace(project.metadata?.name);
            }
          : undefined,
    });

  const primaryActions = canCreate
    ? [
        <Button key="create-project-action" variant={ButtonVariant.primary} onClick={onClickCreate}>
          {t('public~Create a new project')}
        </Button>,
      ]
    : [];

  const secondaryActions = [
    <Button
      key="download-cli-tools"
      variant={ButtonVariant.link}
      component="a"
      href="/command-line-tools"
    >
      {t('public~Download command-line tools')}
    </Button>,
    <ExternalLinkButton key="visit-docs" variant={ButtonVariant.link} href={openshiftHelpBase}>
      {t('public~View documentation')}
    </ExternalLinkButton>,
  ];
  return (
    <ConsoleEmptyState
      variant={EmptyStateVariant.xl}
      icon={ClusterIcon}
      title={t('public~Hello, world')}
      primaryActions={primaryActions}
      secondaryActions={secondaryActions}
    >
      {canCreate ? (
        <p>{t('public~To get started, create a project for your application.')}</p>
      ) : (
        <p>
          {t(
            "public~To get started, you'll need a project. Currently, you can't create or access any projects.",
          )}
          {!createProjectMessage &&
            t("public~ You'll need to contact a cluster administrator for help.")}
        </p>
      )}
      {createProjectMessage && (
        <p className="co-pre-line">
          <LinkifyExternal>{createProjectMessage}</LinkifyExternal>
        </p>
      )}
    </ConsoleEmptyState>
  );
};

type WithStartGuide = <P>(
  WrappedComponent: React.ComponentType<P & WithStartGuideProps>,
  disable?: boolean,
) => React.ComponentType<P>;

export const withStartGuide: WithStartGuide = (WrappedComponent, disable = true) => (
  props: any,
) => {
  const showOpenshiftStartGuide = useFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE);
  const { kindObj } = props;
  const kind = _.get(kindObj, 'kind', props.kind);

  // The start guide does not need to be shown on the Projects list page.
  if (kind === ProjectModel.kind || !showOpenshiftStartGuide) {
    return <WrappedComponent {...props} />;
  }

  return (
    <>
      <OpenShiftGettingStarted />
      <Divider />
      {!disable || (props.kindObj && !props.kindObj.namespaced) ? (
        <WrappedComponent {...props} noProjectsAvailable />
      ) : (
        <Disabled>
          <WrappedComponent {...props} noProjectsAvailable />
        </Disabled>
      )}
    </>
  );
};

type OpenShiftGettingStartedProps = {
  title?: string;
};

export type WithStartGuideProps = {
  noProjectsAvailable?: boolean;
};
