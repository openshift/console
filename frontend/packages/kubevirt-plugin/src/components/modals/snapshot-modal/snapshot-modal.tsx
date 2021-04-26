import { isEmpty } from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import {
  ExternalLink,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { k8sCreate } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';
import {
  Alert,
  AlertVariant,
  Checkbox,
  ExpandableSection,
  Form,
  Stack,
  StackItem,
  TextArea,
  TextInput,
} from '@patternfly/react-core';

import { SNAPSHOT_SUPPORT_URL } from '../../../constants';
import { stopVM } from '../../../k8s/requests/vm/actions';
import { VMSnapshotWrapper } from '../../../k8s/wrapper/vm/vm-snapshot-wrapper';
import { asVM, getVolumeSnapshotStatuses } from '../../../selectors/vm';
import { VMSnapshot } from '../../../types';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { buildOwnerReference, prefixedID } from '../../../utils';
import { FormRow } from '../../form/form-row';
import { ModalFooter } from '../modal/modal-footer';

import './snapshot-modal.scss';

const getSnapshotName = (vmName: string) => {
  const date = new Date();
  return [vmName, date.getFullYear(), date.getUTCMonth() + 1, date.getDate()].join('-');
};

const SnapshotsModal = withHandlePromise((props: SnapshotsModalProps) => {
  const {
    vmLikeEntity,
    inProgress,
    errorMessage,
    handlePromise,
    close,
    cancel,
    isVMRunningOrExpectedRunning,
    snapshots,
  } = props;
  const { t } = useTranslation();
  const vmName = getName(vmLikeEntity);
  const [name, setName] = React.useState(getSnapshotName(vmName));
  const [description, setDescription] = React.useState('');
  const [approveUnsupported, setApproveUnsupported] = React.useState(false);
  const asId = prefixedID.bind(null, 'snapshot');

  const volumeSnapshotStatuses = getVolumeSnapshotStatuses(asVM(vmLikeEntity)) || [];
  const supportedVolumes = volumeSnapshotStatuses.filter((status) => status?.enabled);
  const unsupportedVolumes = volumeSnapshotStatuses.filter((status) => !status?.enabled);
  const hasUnsupportedVolumes = unsupportedVolumes.length > 0;

  const submit = async (e) => {
    e.preventDefault();
    const snapshotWrapper = new VMSnapshotWrapper()
      .init({
        name,
        description,
        namespace: getNamespace(vmLikeEntity),
        vmName,
      })
      .addOwnerReferences(buildOwnerReference(vmLikeEntity, { blockOwnerDeletion: false }));
    const isValidName = isEmpty(snapshots.filter(({ metadata }) => metadata?.name === name));
    snapshotWrapper &&
      isVMRunningOrExpectedRunning &&
      isValidName &&
      (await stopVM(asVM(vmLikeEntity)));
    handlePromise(k8sCreate(snapshotWrapper.getModel(), snapshotWrapper.asResource()), close);
  };

  return (
    <div className="modal-content">
      <ModalTitle>{t('kubevirt-plugin~Take Snapshot')}</ModalTitle>
      <ModalBody>
        <Alert
          title={t(
            'kubevirt-plugin~Snapshot only includes disks backed by a snapshot supported storage class',
          )}
          isInline
          variant={AlertVariant.info}
          className="co-m-form-row"
        />
        <Form onSubmit={submit}>
          <FormRow title={t('kubevirt-plugin~Snapshot Name')} fieldId={asId('name')} isRequired>
            <TextInput
              autoFocus
              isRequired
              id={asId('name')}
              value={name}
              onChange={(v) => setName(v)}
            />
          </FormRow>
          <FormRow title={t('kubevirt-plugin~Description')} fieldId={asId('desc')}>
            <TextArea
              value={description}
              onChange={(d) => setDescription(d)}
              aria-label={t('kubevirt-plugin~description text area')}
            />
          </FormRow>
          <FormRow fieldId="supported-volumes">
            <Stack hasGutter>
              {supportedVolumes.length > 0 && (
                <StackItem>
                  <ExpandableSection
                    toggleText={t('kubevirt-plugin~Disks included in this snapshot ({{count}})', {
                      count: supportedVolumes?.length,
                    })}
                  >
                    <Stack>
                      {supportedVolumes?.map((vol) => (
                        <StackItem key={vol.name}>{vol.name}</StackItem>
                      ))}
                    </Stack>
                  </ExpandableSection>
                </StackItem>
              )}
              {hasUnsupportedVolumes && (
                <StackItem>
                  <Alert
                    variant={AlertVariant.warning}
                    isInline
                    title={t(
                      'kubevirt-plugin~The following disk will not be included in the snapshot',
                      { count: unsupportedVolumes?.length },
                    )}
                  >
                    <Stack hasGutter>
                      <StackItem>
                        <Stack>
                          {unsupportedVolumes?.map((vol) => (
                            <StackItem key={vol.name}>
                              <strong>{vol.name}</strong> - {vol.reason}
                            </StackItem>
                          ))}
                        </Stack>
                      </StackItem>
                      <StackItem>
                        {t(
                          'kubevirt-plugin~Edit the disk or contact your cluster admin for further details.',
                          { count: unsupportedVolumes?.length },
                        )}
                      </StackItem>
                      <StackItem>
                        <ExternalLink
                          additionalClassName="kv-snapshot-modal__link"
                          text={<div>{t('kubevirt-plugin~Learn more about snapshots')}</div>}
                          href={SNAPSHOT_SUPPORT_URL}
                        />
                      </StackItem>
                    </Stack>
                  </Alert>
                </StackItem>
              )}
              {isVMRunningOrExpectedRunning && (
                <StackItem>
                  <Alert
                    variant={AlertVariant.warning}
                    isInline
                    title={t(
                      'kubevirt-plugin~The VM {{vmName}} is still running. It will be powered off.',
                      { vmName },
                    )}
                  />
                </StackItem>
              )}
            </Stack>
          </FormRow>
          {(hasUnsupportedVolumes || isVMRunningOrExpectedRunning) && (
            <FormRow fieldId="unsupported-approve-checkbox">
              <Checkbox
                id="approve-checkbox"
                isChecked={approveUnsupported}
                aria-label={t('kubevirt-plugin~unsupported approve checkbox')}
                label={t('kubevirt-plugin~I am aware of this warning and wish to proceed')}
                onChange={setApproveUnsupported}
              />
            </FormRow>
          )}
        </Form>
      </ModalBody>
      <ModalFooter
        id="snapshot"
        submitButtonText={t('kubevirt-plugin~Save')}
        errorMessage={errorMessage}
        isDisabled={inProgress || (hasUnsupportedVolumes && !approveUnsupported)}
        inProgress={inProgress}
        onSubmit={submit}
        onCancel={(e) => {
          e.stopPropagation();
          cancel();
        }}
      />
    </div>
  );
});

export default createModalLauncher(SnapshotsModal);

export type SnapshotsModalProps = {
  vmLikeEntity: VMLikeEntityKind;
  isVMRunningOrExpectedRunning: boolean;
  snapshots: VMSnapshot[];
} & ModalComponentProps &
  HandlePromiseProps;
