import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Button, ButtonVariant, Divider } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon';

import { FLAGS } from '@console/shared/src/constants';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useFlag } from '@console/shared/src/hooks/flag';
import { createProjectMessageStateToProps } from '../reducers/ui';
import { openshiftHelpBase, LinkifyExternal, ConsoleEmptyState } from './utils';
import { ProjectModel } from '../models';
import { K8sResourceKind } from '../module/k8s/types';
import { useCreateNamespaceOrProjectModal } from '@console/shared/src/hooks/useCreateNamespaceOrProjectModal';

export const OpenShiftGettingStarted = connect(createProjectMessageStateToProps)(
  ({ canCreate = true, createProjectMessage }: OpenShiftGettingStartedProps) => {
    const { t } = useTranslation();
    const [, setActiveNamespace] = useActiveNamespace();
    const [perspective] = useActivePerspective();
    const createNamespaceOrProjectModal = useCreateNamespaceOrProjectModal();

    const onClickCreate = () => {
      createNamespaceOrProjectModal({
        onSubmit:
          perspective !== 'admin'
            ? (project: K8sResourceKind) => {
                setActiveNamespace(project.metadata?.name);
              }
            : undefined,
      });
    };

    const primaryActions = canCreate
      ? [
          <Button
            key="create-project-action"
            variant={ButtonVariant.primary}
            onClick={onClickCreate}
          >
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
      <Button key="visit-docs" variant={ButtonVariant.link} component="a" href={openshiftHelpBase}>
        {t('public~View documentation')}
      </Button>,
    ];

    return (
      <ConsoleEmptyState
        icon={CubesIcon}
        title={t('public~Hello, world')}
        primaryActions={primaryActions}
        secondaryActions={secondaryActions}
      >
        {canCreate ? (
          <p>{t('public~To get started, create a project for your application.')}</p>
        ) : (
          <>
            <p>
              <Trans t={t} ns="public">
                To get started, you'll need a project. Currently, you can't create or access any
                projects.
              </Trans>
              {!createProjectMessage && (
                <>&nbsp;{t("public~You'll need to contact a cluster administrator for help.")}</>
              )}
            </p>
            {createProjectMessage && (
              <p className="co-pre-line">
                <LinkifyExternal>{createProjectMessage}</LinkifyExternal>
              </p>
            )}
          </>
        )}
      </ConsoleEmptyState>
    );
  },
);

type WithStartGuide = <P>(
  WrappedComponent: React.ComponentType<P & WithStartGuideProps>,
) => React.ComponentType<P>;

export const withStartGuide: WithStartGuide = (WrappedComponent) => (props: any) => {
  const showOpenshiftStartGuide = useFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE);
  const canCreateNS = useFlag(FLAGS.CAN_CREATE_NS);
  const canCreateProject = useFlag(FLAGS.CAN_CREATE_PROJECT);
  const { kindObj } = props;
  const kind = _.get(kindObj, 'kind', props.kind);

  // The start guide does not need to be shown on the Projects list page.
  if (kind === ProjectModel.kind) {
    return <WrappedComponent {...props} />;
  }

  if (showOpenshiftStartGuide) {
    return (
      <>
        <OpenShiftGettingStarted canCreate={canCreateNS || canCreateProject} />
        <Divider />
        <WrappedComponent {...props} noProjectsAvailable />
      </>
    );
  }

  return <WrappedComponent {...props} />;
};

type OpenShiftGettingStartedProps = {
  canCreate: boolean;
  createProjectMessage: string;
};

export type WithStartGuideProps = {
  noProjectsAvailable?: boolean;
};
