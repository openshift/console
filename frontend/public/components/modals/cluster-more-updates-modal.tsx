import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import { isClusterExternallyManaged } from '@console/shared';
import {
  ClusterVersionKind,
  getConditionUpgradeableFalse,
  getLastCompletedUpdate,
  getReleaseNotesLink,
  getSortedAvailableUpdates,
  isMinorVersionNewer,
  showReleaseNotes,
} from '../../module/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalFooter,
  ModalTitle,
  createModalLauncher,
} from '../factory/modal';
import {
  ClusterNotUpgradeableAlert,
  UpdateBlockedLabel,
} from '../cluster-settings/cluster-settings';
import { ReleaseNotesLink } from '../utils';

export const ClusterMoreUpdatesModal: React.FC<ClusterMoreUpdatesModalProps> = ({ cancel, cv }) => {
  const availableUpdates = getSortedAvailableUpdates(cv);
  const moreAvailableUpdates = availableUpdates.slice(1).reverse();
  const releaseNotes = showReleaseNotes();
  const clusterUpgradeableFalseAndNotExternallyManaged =
    !!getConditionUpgradeableFalse(cv) && !isClusterExternallyManaged();
  const { t } = useTranslation();

  return (
    <div className="modal-content" data-test="more-updates-modal">
      <ModalTitle>{t('public~Other available paths')}</ModalTitle>
      <ModalBody>
        {clusterUpgradeableFalseAndNotExternallyManaged && (
          <ClusterNotUpgradeableAlert cv={cv} onCancel={cancel} />
        )}
        <table className="pf-v5-c-table pf-m-compact pf-m-border-rows">
          <thead className="pf-v5-c-table__thead">
            <tr className="pf-v5-c-table__tr">
              <th className="pf-v5-c-table__th">{t('public~Version')}</th>
              {releaseNotes && <th className="pf-v5-c-table__th">{t('public~Release notes')}</th>}
            </tr>
          </thead>
          <tbody className="pf-v5-c-table__tbody">
            {moreAvailableUpdates.map((update) => {
              return (
                <tr className="pf-v5-c-table__tr" key={update.version}>
                  <td className="pf-v5-c-table__td">
                    {update.version}
                    {clusterUpgradeableFalseAndNotExternallyManaged &&
                      isMinorVersionNewer(getLastCompletedUpdate(cv), update.version) && (
                        <UpdateBlockedLabel />
                      )}
                  </td>
                  {releaseNotes && (
                    <td className="pf-v5-c-table__td">
                      {getReleaseNotesLink(update.version) ? (
                        <ReleaseNotesLink version={update.version} />
                      ) : (
                        '-'
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </ModalBody>
      <ModalFooter inProgress={false}>
        <ActionGroup className="pf-v5-c-form pf-v5-c-form__actions--right pf-v5-c-form__group--no-top-margin">
          <Button
            type="button"
            variant="primary"
            onClick={cancel}
            data-test="more-updates-modal-close-button"
          >
            {t('Close')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </div>
  );
};

export const clusterMoreUpdatesModal = createModalLauncher(ClusterMoreUpdatesModal);

export type ClusterMoreUpdatesModalProps = {
  cv: ClusterVersionKind;
} & ModalComponentProps;
