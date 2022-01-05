import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import SSHCreateService from '../SSHCreateService/SSHCreateService';
import SSHForm from '../SSHForm/SSHForm';

import './ssh-wizard.scss';

const SSHWizard: React.FC = () => {
  const { t } = useTranslation();
  const [isKeyHidden, setIsKeyHidden] = React.useState<boolean>(true);

  return (
    <>
      <Accordion>
        <AccordionItem>
          <AccordionToggle
            className="AdvancedTab-tab-title"
            onClick={() => setIsKeyHidden(!isKeyHidden)}
            isExpanded={!isKeyHidden}
            id="authorized-key"
          >
            {t('kubevirt-plugin~Authorized Key')}
          </AccordionToggle>
          <AccordionContent isHidden={isKeyHidden}>
            <SSHForm className="SSHWizard-authorized-key-form" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="SSHWizard-enable-ssh-title">
        <SSHCreateService />
      </div>
    </>
  );
};

export default SSHWizard;
