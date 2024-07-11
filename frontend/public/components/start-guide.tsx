import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom-v5-compat';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';

import { FLAGS } from '@console/shared/src/constants';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { createProjectMessageStateToProps } from '../reducers/ui';
import { Disabled, HintBlock, ExternalLink, openshiftHelpBase, LinkifyExternal } from './utils';
import { connectToFlags } from '../reducers/connectToFlags';
import { ProjectModel } from '../models';
import { K8sResourceKind } from '../module/k8s/types';
import { useCreateNamespaceOrProjectModal } from '@console/shared/src/hooks/useCreateNamespaceOrProjectModal';

export const OpenShiftGettingStarted = connect(createProjectMessageStateToProps)(
  ({ canCreate = true, createProjectMessage }: OpenShiftGettingStartedProps) => {
    const { t } = useTranslation();
    const [, setActiveNamespace] = useActiveNamespace();
    const [perspective] = useActivePerspective();
    const createNamespaceOrProjectModal = useCreateNamespaceOrProjectModal();

    return (
      <>
        {canCreate ? (
          <p>
            {t(
              'public~OpenShift helps you quickly develop, host, and scale applications. To get started, create a project for your application.',
            )}
          </p>
        ) : (
          <p>
            {t(
              "public~OpenShift helps you quickly develop, host, and scale applications. To get started, you'll need a project. Currently, you can't create or access any projects.",
            )}
            {!createProjectMessage && (
              <>&nbsp;{t("public~You'll need to contact a cluster administrator for help.")}</>
            )}
          </p>
        )}
        {createProjectMessage && (
          <p className="co-pre-line">
            <LinkifyExternal>{createProjectMessage}</LinkifyExternal>
          </p>
        )}
        <p>
          <Trans t={t} ns="public">
            To learn more, visit the OpenShift{' '}
            <ExternalLink href={openshiftHelpBase}>documentation</ExternalLink>.
          </Trans>
        </p>
        <p>
          <Trans t={t} ns="public">
            Download the <Link to="/command-line-tools">command-line tools</Link>
          </Trans>
        </p>
        {canCreate ? (
          <Button
            variant="link"
            onClick={() =>
              createNamespaceOrProjectModal({
                onSubmit:
                  perspective !== 'admin'
                    ? (project: K8sResourceKind) => {
                        setActiveNamespace(project.metadata?.name);
                      }
                    : undefined,
              })
            }
          >
            {t('public~Create a new project')}
          </Button>
        ) : null}
      </>
    );
  },
);

type WithStartGuide = <P>(
  WrappedComponent: React.ComponentType<P & WithStartGuideProps>,
  disable?: boolean,
) => React.ComponentType<P>;

export const withStartGuide: WithStartGuide = (WrappedComponent, disable = true) =>
  connectToFlags<any>(
    FLAGS.SHOW_OPENSHIFT_START_GUIDE,
    FLAGS.CAN_CREATE_NS,
    FLAGS.CAN_CREATE_PROJECT,
  )(({ flags, ...rest }: any) => {
    const { kindObj } = rest;
    const kind = _.get(kindObj, 'kind', rest.kind);

    // The start guide does not need to be shown on the Projects list page.
    if (kind === ProjectModel.kind) {
      return <WrappedComponent {...rest} />;
    }

    if (flags[FLAGS.SHOW_OPENSHIFT_START_GUIDE]) {
      return (
        <>
          <div className="co-m-pane__body">
            <HintBlock title="Getting Started">
              <OpenShiftGettingStarted
                canCreate={flags[FLAGS.CAN_CREATE_NS] || flags[FLAGS.CAN_CREATE_PROJECT]}
              />
            </HintBlock>
          </div>
          {!disable || (rest.kindObj && !rest.kindObj.namespaced) ? (
            <WrappedComponent {...rest} noProjectsAvailable />
          ) : (
            <Disabled>
              <WrappedComponent {...rest} noProjectsAvailable />
            </Disabled>
          )}
        </>
      );
    }
    return <WrappedComponent {...rest} />;
  });

type OpenShiftGettingStartedProps = {
  canCreate: boolean;
  createProjectMessage: string;
};

export type WithStartGuideProps = {
  noProjectsAvailable?: boolean;
};
