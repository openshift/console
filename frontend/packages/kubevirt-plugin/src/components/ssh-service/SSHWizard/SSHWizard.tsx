import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import useSSHKeys from '../../../hooks/use-ssh-keys';
import SSHCreateService from '../SSHCreateService/SSHCreateService';
import SSHForm from '../SSHForm/SSHForm';

import './ssh-wizard.scss';

const SSHWizard: React.FC = () => {
  const { t } = useTranslation();
  const [toggledItem, setToggledItem] = React.useState<boolean>();
  const { enableSSHService } = useSSHKeys();

  React.useEffect(() => {
    !enableSSHService && setToggledItem(false);
  }, [enableSSHService]);

  return (
    <div>
      <div>
        <div
          role="none"
          onClick={() => {
            enableSSHService && setToggledItem((toggled) => !toggled);
          }}
          className={cn('SSHWizard-authorized-key', {
            'SSHWizard-authorized-key-disabled': !enableSSHService,
          })}
        >
          <div className="SSHWizard-authorized-key-title">
            {toggledItem ? <AngleDownIcon /> : <AngleRightIcon />}
            <Text component={TextVariants.h6}>{t('kubevirt-plugin~Authorized Key')}</Text>
          </div>
        </div>
        {toggledItem && <SSHForm className="SSHWizard-authorized-key-form" />}
      </div>
      <div className="SSHWizard-enable-ssh-title">
        <SSHCreateService />
      </div>
    </div>
  );
};

export default SSHWizard;
