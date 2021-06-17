import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectOption } from '@patternfly/react-core';

import { ClusterVersionModel } from '../../models';
import { HandlePromiseProps, withHandlePromise } from '../utils';
import {
  ClusterVersionKind,
  getAvailableClusterUpdates,
  getConditionUpgradeableFalse,
  getDesiredClusterVersion,
  getSortedUpdates,
  isMinorVersionNewer,
  k8sPatch,
} from '../../module/k8s';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory/modal';
import { ClusterNotUpgradeableAlert } from '../cluster-settings/cluster-settings';

const ClusterUpdateModal = withHandlePromise((props: ClusterUpdateModalProps) => {
  const { cancel, close, cv, errorMessage, handlePromise, inProgress } = props;
  const clusterUpgradeableFalse = !!getConditionUpgradeableFalse(cv);
  const availableSortedUpdates = getSortedUpdates(cv);
  const currentVersion = getDesiredClusterVersion(cv);
  const currentMinorVersionPatchUpdate = availableSortedUpdates?.find(
    (update) => !isMinorVersionNewer(currentVersion, update.version),
  );
  const [desiredVersion, setDesiredVersion] = React.useState(
    (clusterUpgradeableFalse
      ? currentMinorVersionPatchUpdate?.version
      : availableSortedUpdates[0]?.version) || '',
  );
  const [error, setError] = React.useState(errorMessage);
  const [isOpen, setIsOpen] = React.useState(false);
  const onToggle = () => setIsOpen(!isOpen);
  const onSelect = (event, selection) => {
    event.preventDefault();
    setDesiredVersion(selection);
    setIsOpen(!isOpen);
  };
  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const available = getAvailableClusterUpdates(cv);
    const desired = _.find(available, { version: desiredVersion });
    if (!desired) {
      setError(
        `Version ${desiredVersion} not found among the available updates. Select another version.`,
      );
      return;
    }

    // Clear any previous error message.
    setError('');
    const patch = [{ op: 'add', path: '/spec/desiredUpdate', value: desired }];
    return handlePromise(k8sPatch(ClusterVersionModel, cv, patch), close);
  };
  const options = availableSortedUpdates.map(({ version }) => {
    return (
      <SelectOption
        key={version}
        value={version}
        isDisabled={clusterUpgradeableFalse && isMinorVersionNewer(currentVersion, version)}
      />
    );
  });
  const { t } = useTranslation();

  return (
    <form onSubmit={submit} name="form" className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{t('public~Update cluster')}</ModalTitle>
      <ModalBody>
        {clusterUpgradeableFalse && <ClusterNotUpgradeableAlert cv={cv} />}
        <div className="form-group">
          <label>{t('public~Current version')}</label>
          <p>{currentVersion}</p>
        </div>
        <div className="form-group">
          <label id="version-label">{t('public~Select new version')}</label>
          <Select
            aria-labelledby="version-label"
            onToggle={onToggle}
            onSelect={onSelect}
            selections={desiredVersion}
            isOpen={isOpen}
            isDisabled={clusterUpgradeableFalse && !currentMinorVersionPatchUpdate}
          >
            {options}
          </Select>
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={error}
        inProgress={inProgress}
        submitText={t('public~Update')}
        cancelText={t('public~Cancel')}
        cancel={cancel}
        submitDisabled={!desiredVersion}
      />
    </form>
  );
});

export const clusterUpdateModal = createModalLauncher(ClusterUpdateModal);

type ClusterUpdateModalProps = {
  cv: ClusterVersionKind;
} & ModalComponentProps &
  HandlePromiseProps;
