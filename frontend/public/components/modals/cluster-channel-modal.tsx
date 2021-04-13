import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { TextInput } from '@patternfly/react-core';
import * as semver from 'semver';

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
import {
  ClusterVersionKind,
  getAvailableClusterChannels,
  getLastCompletedUpdate,
  k8sPatch,
} from '../../module/k8s';

const ClusterChannelModal = withHandlePromise((props: ClusterChannelModalProps) => {
  const { cancel, close, cv, errorMessage, handlePromise, inProgress } = props;
  const [channel, setChannel] = React.useState(cv.spec.channel);
  const { t } = useTranslation();
  const availableChannels = getAvailableClusterChannels(cv).reduce((o, val) => {
    o[val] = val;
    return o;
  }, {});
  const version = semver.parse(getLastCompletedUpdate(cv));
  const channelsExist = cv.status?.desired?.channels?.length;
  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const patch = [{ op: 'add', path: '/spec/channel', value: channel }];
    return handlePromise(k8sPatch(ClusterVersionModel, cv, patch), close);
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>
        {channelsExist
          ? t('cluster-channel-modal~Select channel')
          : t('cluster-channel-modal~Input channel')}
      </ModalTitle>
      <ModalBody>
        <p>
          {channelsExist
            ? t(
                'cluster-channel-modal~The current version is available in the channels listed in the dropdown below. Select a channel that reflects the desired version. Critical security updates will be delivered to any vulnerable channels.',
              )
            : t(
                'cluster-channel-modal~Input a channel that reflects the desired version. To verify if the version exists in a channel, save and check the update status. Critical security updates will be delivered to any vulnerable channels.',
              )}
        </p>
        <p>
          <ChannelDocLink />
        </p>
        <div className="form-group">
          <label htmlFor="channel">{t('cluster-channel-modal~Channel')}</label>
          {channelsExist ? (
            <Dropdown
              className="cluster-channel-modal__dropdown"
              id="channel"
              items={availableChannels}
              onChange={(newChannel: string) => setChannel(newChannel)}
              selectedKey={channel}
              title={t('cluster-channel-modal~Channel')}
            />
          ) : (
            <>
              <TextInput
                id="channel"
                onChange={(newChannel) => setChannel(newChannel)}
                value={channel}
                placeholder={t(`cluster-channel-modal~e.g., {{version}}`, {
                  version: `stable-${version.major}.${version.minor}`,
                })}
              />
              <p className="help-block">
                {t(
                  `cluster-channel-modal~Potential channels are {{stable}}, {{fast}}, or {{candidate}}.`,
                  {
                    stable: `stable-${version.major}.${version.minor}`,
                    fast: `fast-${version.major}.${version.minor}`,
                    candidate: `candidate-${version.major}.${version.minor}`,
                  },
                )}
              </p>
            </>
          )}
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
  cv: ClusterVersionKind;
  t: TFunction;
} & ModalComponentProps &
  HandlePromiseProps;
