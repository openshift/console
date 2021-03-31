import * as React from 'react';
import SSHModal from '../SSHModal';
import useSSHService from '../../../hooks/use-ssh-service';
import { Stack, StackItem, ClipboardCopy, TextVariants, Text } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { VMKind, VMIKind } from '@console/kubevirt-plugin/src/types';
import useSSHCommand from '../../../hooks/use-ssh-command';
import { EditButton } from '../../edit-button';

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
          <Text component={TextVariants.p}>{t('kubevirt-plugin~user: {{user}}', { user })}</Text>
          <div className="SSHDetailsPage-clipboard-command">
            <ClipboardCopy isReadOnly>
              {sshServices?.running ? command : `ssh ${user}@`}
            </ClipboardCopy>
          </div>
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
          {sshServices?.running
            ? t('kubevirt-plugin~port: {{port}}', { port: sshServices?.port })
            : t('kubevirt-plugin~SSH Service unavailable')}
        </StackItem>
      </Stack>
    </>
  );
};

export default SSHDetailsPage;
