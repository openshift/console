import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Button, ButtonVariant, Popover, PopoverPosition } from '@patternfly/react-core';

import './vm-ip.scss';

type VMIPProps = {
  data: string[];
};

const VMIP: React.FC<VMIPProps> = ({ data }) => {
  const { t } = useTranslation();
  const isMoreThenOneIp = data.length > 1;
  return (
    <div className="kv-vm-ips--main">
      <div>{data?.[0]}</div>
      {isMoreThenOneIp && (
        <Popover
          headerContent={
            <div>{t('kubevirt-plugin~IP Addresses ({{ips}})', { ips: data.length })}</div>
          }
          bodyContent={Array.isArray(data) && data?.map((ip) => <div>{ip}</div>)}
          hasAutoWidth
          position={PopoverPosition.top}
        >
          <Button className="kv-vm-ips--more-button" variant={ButtonVariant.link}>
            {t('kubevirt-plugin~+{{ips}} more', { ips: data.length - 1 })}
          </Button>
        </Popover>
      )}
    </div>
  );
};

export default VMIP;
