import * as React from 'react';
import { Alert, Text, TextVariants } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useHistory } from 'react-router-dom';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { ExternalLink } from '@console/internal/components/utils';
import {
  createInstallUrl,
  PackageManifestKind,
  SubscriptionsKind,
} from '../../../utils/migration-tool-utils';
import { ModalFooter } from '../../modals/modal/modal-footer';

import './migration-tool.scss';

type MigrationToolProps = ModalComponentProps & {
  mtvOperator: PackageManifestKind;
  mtvSubscription: SubscriptionsKind;
  createForkLift: Function;
};

const MigrationTool: React.FC<MigrationToolProps> = ({
  mtvOperator,
  mtvSubscription,
  createForkLift,
  close,
}) => {
  const { t } = useTranslation();
  const history = useHistory();

  const onSubmit = () => {
    mtvSubscription ? createForkLift() : history.push(createInstallUrl(mtvOperator));
    close();
  };

  return (
    <div className="kv-migration-tool--popover">
      <ModalTitle>{t('kubevirt-plugin~Migration Tool Operator required')}</ModalTitle>
      <ModalBody>
        {mtvOperator ? (
          mtvSubscription ? (
            <Text component={TextVariants.p}>
              {t(
                'kubevirt-plugin~The Migration Toolkit operator is successfully installed, please install Forklift instance in order to use the Migration Toolkit',
              )}
            </Text>
          ) : (
            <Trans t={t} ns="kubevirt-plugin">
              <Text component={TextVariants.p}>
                The Migration Tool for Virtualization Operator facilitates the migration of multiple
                Virtual Machine workloads to Openshift Virtualization.
              </Text>
              <Text component={TextVariants.p}>
                Clicking the Install Migration Toolkit button will take you to the{' '}
                <Link onClick={close} to={'/operatorhub'}>
                  OperatorHub.
                </Link>
              </Text>
              <Text component={TextVariants.p}>
                After the operator installation, please restart the Forklift instance
              </Text>
            </Trans>
          )
        ) : (
          <Alert
            variant="warning"
            isInline
            title={t(
              'kubevirt-plugin~The Migration Tool operator could not be installed because it is not available on the cluster',
            )}
          >
            <ExternalLink
              text={t('kubevirt-plugin~Learn more')}
              href="https://access.redhat.com/documentation/en-us/migration_toolkit_for_virtualization/2.0/"
            />
          </Alert>
        )}
      </ModalBody>
      <ModalFooter
        onSubmit={onSubmit}
        isDisabled={!mtvOperator}
        onCancel={close}
        submitButtonText={
          mtvSubscription
            ? t('kubevirt-plugin~Install ForkLift Instance')
            : t('kubevirt-plugin~Install Migration Tool')
        }
        cancelButtonText={t('kubevirt-plugin~Close')}
      />
    </div>
  );
};

export default createModalLauncher(MigrationTool);
