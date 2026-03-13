import type { FormEventHandler } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Content,
  ContentVariants,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  TextInput,
} from '@patternfly/react-core';
import * as semver from 'semver';

import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ChannelDocLink } from '../cluster-settings/cluster-settings';
import { ClusterVersionModel } from '../../models';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { isManaged } from '../utils/documentation';
import { ModalComponentProps } from '../factory/modal';
import {
  ClusterVersionKind,
  getAvailableClusterChannels,
  getLastCompletedUpdate,
  k8sPatch,
} from '../../module/k8s';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

export const ClusterChannelModal = (props: ClusterChannelModalProps) => {
  const { cancel, close, cv } = props;
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [channel, setChannel] = useState(cv.spec.channel);
  const { t } = useTranslation();
  const availableChannels = getAvailableClusterChannels(cv).reduce((o, val) => {
    o[val] = val;
    return o;
  }, {});
  const version = semver.parse(getLastCompletedUpdate(cv));
  const versionMajor = version?.major ?? 4;
  const versionMinor = version?.minor ?? 0;
  const channelsExist = cv.status?.desired?.channels?.length;
  const submit: FormEventHandler<HTMLFormElement> = (e): void => {
    e.preventDefault();
    const patch = [{ op: 'add', path: '/spec/channel', value: channel }];
    handlePromise(k8sPatch(ClusterVersionModel, cv, patch))
      .then(() => close())
      .catch(() => {});
  };

  return (
    <>
      <ModalHeader
        title={channelsExist ? t('public~Select channel') : t('public~Input channel')}
        data-test-id="modal-title"
        labelId="cluster-channel-modal-title"
      />
      <ModalBody>
        <Form id="cluster-channel-form" onSubmit={submit}>
          <Content>
            <Content component={ContentVariants.p}>
              {channelsExist
                ? t(
                    'public~The current version is available in the channels listed in the dropdown below. Select a channel that reflects the desired version. Critical security updates will be delivered to any vulnerable channels.',
                  )
                : t(
                    'public~Input a channel that reflects the desired version. To verify if the version exists in a channel, save and check the update status. Critical security updates will be delivered to any vulnerable channels.',
                  )}
            </Content>
            {!isManaged() && (
              <Content component={ContentVariants.p}>
                <ChannelDocLink />
              </Content>
            )}
          </Content>
          <FormGroup label={t('public~Channel')} fieldId="channel">
            {channelsExist ? (
              <ConsoleSelect
                className="cluster-channel-modal__dropdown"
                id="channel"
                items={availableChannels}
                onChange={(newChannel: string) => setChannel(newChannel)}
                selectedKey={channel}
                title={t('public~Channel')}
              />
            ) : (
              <>
                <TextInput
                  id="channel"
                  onChange={(_event, newChannel) => setChannel(newChannel)}
                  value={channel}
                  placeholder={t(`public~e.g., {{version}}`, {
                    version: `stable-${versionMajor}.${versionMinor}`,
                  })}
                  data-test="channel-modal-input"
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      {t(`public~Potential channels are {{stable}}, {{fast}}, or {{candidate}}.`, {
                        stable: `stable-${versionMajor}.${versionMinor}`,
                        fast: `fast-${versionMajor}.${versionMinor}`,
                        candidate: `candidate-${versionMajor}.${versionMinor}`,
                      })}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </>
            )}
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          isLoading={inProgress}
          form="cluster-channel-form"
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('public~Save')}
        </Button>
        <Button variant="link" onClick={cancel} type="button" data-test-id="modal-cancel-action">
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const ClusterChannelModalOverlay: OverlayComponent<ClusterChannelModalProps> = (props) => {
  return (
    <Modal
      isOpen
      onClose={props.closeOverlay}
      variant={ModalVariant.small}
      data-test="channel-modal"
      aria-labelledby="cluster-channel-modal-title"
    >
      <ClusterChannelModal {...props} close={props.closeOverlay} cancel={props.closeOverlay} />
    </Modal>
  );
};

type ClusterChannelModalProps = {
  cv: ClusterVersionKind;
} & ModalComponentProps;
