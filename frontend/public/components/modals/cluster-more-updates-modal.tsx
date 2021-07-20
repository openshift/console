import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionGroup, Button } from '@patternfly/react-core';

import {
  ClusterVersionKind,
  getConditionUpgradeableFalse,
  getLastCompletedUpdate,
  getReleaseNotesLink,
  getSortedUpdates,
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
  const availableUpdates = getSortedUpdates(cv);
  const moreAvailableUpdates = availableUpdates.slice(1).reverse();
  const releaseNotes = showReleaseNotes();
  const { t } = useTranslation();

  return (
    <div className="modal-content">
      <ModalTitle>{t('public~Other available paths')}</ModalTitle>
      <ModalBody>
        {!!getConditionUpgradeableFalse(cv) && <ClusterNotUpgradeableAlert cv={cv} />}
        <table className="table">
          <thead>
            <tr>
              <th>{t('public~Version')}</th>
              {releaseNotes && <th>{t('public~Release notes')}</th>}
            </tr>
          </thead>
          <tbody>
            {moreAvailableUpdates.map((update) => {
              return (
                <tr key={update.version}>
                  <td>
                    {update.version}
                    {isMinorVersionNewer(getLastCompletedUpdate(cv), update.version) && (
                      <UpdateBlockedLabel />
                    )}
                  </td>
                  {releaseNotes && (
                    <td>
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
        <ActionGroup className="pf-c-form pf-c-form__actions--right pf-c-form__group--no-top-margin">
          <Button type="button" variant="primary" onClick={cancel}>
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
