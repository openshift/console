import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { ClusterVersionModel } from '../../models';
import { Dropdown, HandlePromiseProps, withHandlePromise } from '../utils';
import {
  ClusterVersionKind,
  getAvailableClusterUpdates,
  getDesiredClusterVersion,
  getSortedUpdates,
  k8sPatch,
} from '../../module/k8s';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory/modal';

const ClusterUpdateModal = withHandlePromise((props: ClusterUpdateModalProps) => {
  const { cancel, close, cv, errorMessage, handlePromise, inProgress } = props;
  const [desiredVersion, setDesiredVersion] = React.useState(
    getSortedUpdates(cv)[0]?.version || '',
  );
  const [error, setError] = React.useState(errorMessage);
  const currentVersion = getDesiredClusterVersion(cv);
  const availableSortedUpdates = getSortedUpdates(cv);
  const dropdownItems = _.reduce(
    availableSortedUpdates,
    (acc, { version }) => {
      acc[version] = version;
      return acc;
    },
    {},
  );
  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!desiredVersion) {
      return;
    }
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
  const { t } = useTranslation();

  return (
    <form onSubmit={submit} name="form" className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{t('cluster-update-modal~Update cluster')}</ModalTitle>
      <ModalBody>
        <div className="form-group">
          <label>{t('cluster-update-modal~Current version')}</label>
          <p>{currentVersion}</p>
        </div>
        <div className="form-group">
          <label htmlFor="version_dropdown">{t('cluster-update-modal~Select new version')}</label>
          <Dropdown
            className="cluster-update-modal__dropdown"
            id="version_dropdown"
            items={dropdownItems}
            onChange={(newDesiredVersion: string) => setDesiredVersion(newDesiredVersion)}
            selectedKey={desiredVersion}
            title={t('cluster-update-modal~Select version')}
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={error}
        inProgress={inProgress}
        submitText={t('public~Update')}
        cancelText={t('public~Cancel')}
        cancel={cancel}
      />
    </form>
  );
});

export const clusterUpdateModal = createModalLauncher(ClusterUpdateModal);

type ClusterUpdateModalProps = {
  cv: ClusterVersionKind;
} & ModalComponentProps &
  HandlePromiseProps;
