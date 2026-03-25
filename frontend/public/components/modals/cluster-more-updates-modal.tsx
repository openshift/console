import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { isClusterExternallyManaged } from '@console/shared/src/hooks/useCanClusterUpgrade';
import {
  ClusterVersionKind,
  getConditionUpgradeableFalse,
  getLastCompletedUpdate,
  getReleaseNotesLink,
  getSortedAvailableUpdates,
  isMinorVersionNewer,
  showReleaseNotes,
} from '../../module/k8s';
import { ModalComponentProps } from '@console/shared/src/types/modal';
import {
  ClusterNotUpgradeableAlert,
  UpdateBlockedLabel,
} from '../cluster-settings/cluster-settings';
import { ReleaseNotesLink } from '../utils/release-notes-link';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

export const ClusterMoreUpdatesModal: FC<ClusterMoreUpdatesModalProps> = ({ cancel, cv }) => {
  const availableUpdates = getSortedAvailableUpdates(cv);
  const moreAvailableUpdates = availableUpdates.slice(1).reverse();
  const releaseNotes = showReleaseNotes();
  const clusterUpgradeableFalseAndNotExternallyManaged =
    !!getConditionUpgradeableFalse(cv) && !isClusterExternallyManaged();
  const { t } = useTranslation();

  return (
    <>
      <ModalHeader
        title={t('public~Other available paths')}
        data-test-id="modal-title"
        labelId="cluster-more-updates-modal-title"
      />
      <ModalBody>
        {clusterUpgradeableFalseAndNotExternallyManaged && (
          <ClusterNotUpgradeableAlert cv={cv} onCancel={cancel} />
        )}
        <Table variant="compact" borders>
          <Thead>
            <Tr>
              <Th>{t('public~Version')}</Th>
              {releaseNotes && <Th>{t('public~Release notes')}</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {moreAvailableUpdates.map((update) => {
              return (
                <Tr key={update.version}>
                  <Td>
                    {update.version}
                    {clusterUpgradeableFalseAndNotExternallyManaged &&
                      isMinorVersionNewer(getLastCompletedUpdate(cv), update.version) && (
                        <UpdateBlockedLabel />
                      )}
                  </Td>
                  {releaseNotes && (
                    <Td>
                      {getReleaseNotesLink(update.version) ? (
                        <ReleaseNotesLink version={update.version} />
                      ) : (
                        '-'
                      )}
                    </Td>
                  )}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </ModalBody>
      <ModalFooterWithAlerts>
        <Button
          type="button"
          variant="primary"
          onClick={cancel}
          data-test="more-updates-modal-close-button"
        >
          {t('public~Close')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const ClusterMoreUpdatesModalOverlay: OverlayComponent<ClusterMoreUpdatesModalProps> = (
  props,
) => {
  return (
    <Modal
      isOpen
      onClose={props.closeOverlay}
      variant={ModalVariant.small}
      aria-labelledby="cluster-more-updates-modal-title"
      data-test="more-updates-modal"
    >
      <ClusterMoreUpdatesModal {...props} cancel={props.closeOverlay} />
    </Modal>
  );
};

export type ClusterMoreUpdatesModalProps = {
  cv: ClusterVersionKind;
} & ModalComponentProps;
