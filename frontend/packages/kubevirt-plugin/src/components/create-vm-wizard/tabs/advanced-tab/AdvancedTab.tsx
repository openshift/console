import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CLOUD, SSH, SYSPREP } from '../../../../utils/strings';
import Cloudinit from './cloud-init/Cloudinit';
import SSHAdvancedTab from './ssh/SSHAdvancedTab';
import Sysprep from './sysprep/Sysprep';

import './advanced-tab.scss';

type AdvancedTabProps = {
  wizardReduxID: string;
  key: string;
  isWindowsTemplate: boolean;
};

const AdvancedTab: React.FC<AdvancedTabProps> = ({ wizardReduxID, isWindowsTemplate }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState<string>(isWindowsTemplate ? SYSPREP : CLOUD);

  const onToggle = (value: string) =>
    setExpanded((expandedValue) => (expandedValue === value ? '' : value));

  return (
    <Accordion asDefinitionList>
      <AccordionItem>
        <AccordionToggle
          className="AdvancedTab-tab-title"
          onClick={() => onToggle(CLOUD)}
          isExpanded={expanded === CLOUD}
          id={CLOUD}
        >
          {t('kubevirt-plugin~Cloud-init')}
        </AccordionToggle>
        <AccordionContent isHidden={expanded !== CLOUD}>
          <Cloudinit wizardReduxID={wizardReduxID} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem>
        <AccordionToggle
          className="AdvancedTab-tab-title"
          onClick={() => onToggle(SYSPREP)}
          isExpanded={expanded === SYSPREP}
          id={SYSPREP}
        >
          {t('kubevirt-plugin~Sysprep')}
        </AccordionToggle>
        <AccordionContent isHidden={expanded !== SYSPREP}>
          <Sysprep />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem>
        <AccordionToggle
          className="AdvancedTab-tab-title"
          onClick={() => onToggle(SSH)}
          isExpanded={expanded === SSH}
          id={SSH}
        >
          {t('kubevirt-plugin~SSH access')}
        </AccordionToggle>
        <AccordionContent isHidden={expanded !== SSH}>
          <SSHAdvancedTab />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default AdvancedTab;
