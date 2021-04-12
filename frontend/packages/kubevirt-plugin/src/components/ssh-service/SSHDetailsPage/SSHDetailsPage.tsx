import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { VMIKind, VMKind } from '@console/kubevirt-plugin/src/types';
import { ClipboardCopy, Stack, StackItem, Text, TextVariants } from '@patternfly/react-core';

import useSSHCommand from '../../../hooks/use-ssh-command';
import useSSHService from '../../../hooks/use-ssh-service';
import { EditButton } from '../../edit-button';
import SSHModal from '../SSHModal';

import './ssh-details-page.scss';

type SSHDetailsPageProps = {
  vm: VMKind | VMIKind;
};

const SSHDetailsPage: React.FC<SSHDetailsPageProps> = ({ vm }) => {
  const { sshServices } = useSSHService(vm);
  const { command, user } = useSSHCommand(vm);

  const { t } = useTranslation();
  return (
    <>
      <Stack hasGutter>
        <StackItem>
          <Text component={TextVariants.p} data-test="SSHDetailsPage-user">
            {t('kubevirt-plugin~user: {{user}}', { user })}
          </Text>
          <ClipboardCopy
            isReadOnly
            data-test="SSHDetailsPage-command"
            className="SSHDetailsPage-clipboard-command"
          >
            {sshServices?.running ? command : `ssh ${user}@`}
          </ClipboardCopy>
          {!sshServices?.running && (
            <span className="kubevirt-menu-actions__secondary-title">
              {t('kubevirt-plugin~Requires SSH Service')}
            </span>
          )}
        </StackItem>
        <StackItem>
          <div>
            <b>{t('kubevirt-plugin~SSH Service ')}</b>
            <EditButton
              id="SSHDetailsPage-service-modal"
              canEdit
              onClick={() => SSHModal({ vm })}
            />
          </div>
          <Text component={TextVariants.p} data-test="SSHDetailsPage-port">
            {sshServices?.running
              ? t('kubevirt-plugin~port: {{port}}', { port: sshServices?.port })
              : t('kubevirt-plugin~SSH Service unavailable')}
          </Text>
        </StackItem>
      </Stack>
    </>
  );
};

export default SSHDetailsPage;
