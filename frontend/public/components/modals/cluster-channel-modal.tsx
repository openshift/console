import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

import { ChannelDocLink } from '../cluster-settings/cluster-settings';
import { ClusterVersionModel } from '../../models';
import { Dropdown, HandlePromiseProps, withHandlePromise } from '../utils';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory/modal';
import { getAvailableClusterChannels, k8sPatch, K8sResourceKind } from '../../module/k8s';

const ClusterChannelModal = withHandlePromise((props: ClusterChannelModalProps) => {
  const { cancel, close, cv, errorMessage, handlePromise, inProgress } = props;
  const [channel, setChannel] = React.useState(cv.spec.channel);
  const { t } = useTranslation();
  const availableChannels = getAvailableClusterChannels(cv).reduce((o, val) => {
    o[val] = val;
    return o;
  }, {});
  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const patch = [{ op: 'add', path: '/spec/channel', value: channel }];
    return handlePromise(k8sPatch(ClusterVersionModel, cv, patch), close);
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{t('cluster-channel-modal~Update channel')}</ModalTitle>
      <ModalBody>
        <p>
          {t(
            'cluster-channel-modal~Select a channel that reflects your desired version. Critical security updates will be delivered to any vulnerable channels.',
          )}
        </p>
        <p>
          <ChannelDocLink />
        </p>
        <div className="form-group">
          <label htmlFor="channel_dropdown">{t('cluster-channel-modal~Select channel')}</label>
          <Dropdown
            className="cluster-channel-modal__dropdown"
            id="channel_dropdown"
            items={availableChannels}
            onChange={(newChannel: string) => setChannel(newChannel)}
            selectedKey={channel}
            title={t('cluster-channel-modal~Select channel')}
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Save')}
        cancelText={t('public~Cancel')}
        cancel={cancel}
      />
    </form>
  );
});

export const clusterChannelModal = createModalLauncher(ClusterChannelModal);

type ClusterChannelModalProps = {
  cv: K8sResourceKind;
  t: TFunction;
} & ModalComponentProps &
  HandlePromiseProps;
