import * as React from 'react';
import { ActionGroup, Button } from '@patternfly/react-core';

import {
  ClusterVersionKind,
  getReleaseNotesLink,
  getSortedUpdates,
  showReleaseNotes,
} from '../../module/k8s';
import {
  ModalBody,
  ModalComponentProps,
  ModalFooter,
  ModalTitle,
  createModalLauncher,
} from '../factory/modal';
import { ReleaseNotesLink } from '../cluster-settings/cluster-settings';

export const ClusterMoreUpdatesModal: React.FC<ClusterMoreUpdatesModalProps> = ({ cancel, cv }) => {
  const availableUpdates = getSortedUpdates(cv);
  const moreAvailableUpdates = availableUpdates.slice(1).reverse();
  const releaseNotes = showReleaseNotes();

  return (
    <div className="modal-content">
      <ModalTitle>Other Available Paths</ModalTitle>
      <ModalBody>
        <table className="table">
          <thead>
            <tr>
              <th>Version</th>
              {releaseNotes && <th>Release Notes</th>}
            </tr>
          </thead>
          <tbody>
            {moreAvailableUpdates.map((update) => {
              return (
                <tr key={update.version}>
                  <td>{update.version}</td>
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
            Close
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
