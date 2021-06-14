import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CLOUD, SSH } from '../../../../utils/strings';
import SSHPopover from '../../../ssh-service/SSHPopover/SSHPopover';
import { CloudInitInfoHelper } from './cloud-init/cloud-init-info-helper';
import CloudInitAdvancedTab from './cloud-init/CloudInitAdvancedTab';
import SSHAdvancedTab from './ssh/SSHAdvancedTab';

import './advanced-tab.scss';

type AdvancedTabProps = {
  wizardReduxID: string;
  key: string;
};

const AdvancedTab: React.FC<AdvancedTabProps> = ({
  wizardReduxID,
  key,
}: AdvancedTabProps): React.ReactElement => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState<string>();

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
          {t('kubevirt-plugin~Cloud-init')} <CloudInitInfoHelper />
        </AccordionToggle>
        <AccordionContent isHidden={expanded !== CLOUD}>
          <CloudInitAdvancedTab wizardReduxID={wizardReduxID} key={key} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem>
        <AccordionToggle
          className="AdvancedTab-tab-title"
          onClick={() => onToggle(SSH)}
          isExpanded={expanded === SSH}
          id={SSH}
        >
          {t('kubevirt-plugin~SSH access')} <SSHPopover />
        </AccordionToggle>
        <AccordionContent isHidden={expanded !== SSH}>
          <SSHAdvancedTab />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default AdvancedTab;
