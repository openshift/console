import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldLevelHelp, HorizontalNav } from '@console/internal/components/utils';
import { useHyperconvergedCR } from '../../../hooks/use-hyperconverged-resource';
import HardwareDevicesTable from './HardwareDevicesTable';

export const HardwareDevicesPage: React.FC<any> = (props) => {
  const { t } = useTranslation();
  const [hc, loaded] = useHyperconvergedCR();

  const pages = [
    {
      href: '',
      name: t('kubevirt-plugin~PCI Host devices'),
      component: HardwareDevicesTable,
      pageData: {
        label: t('kubevirt-plugin~PCI Host devices'),
        deviceSelector: (obj) => obj?.spec?.permittedHostDevices?.pciHostDevices,
      },
    },
    {
      href: 'mediated',
      name: t('kubevirt-plugin~Mediated devices'),
      component: HardwareDevicesTable,
      pageData: {
        label: t('kubevirt-plugin~Mediated devices'),
        deviceSelector: (obj) => obj?.spec?.permittedHostDevices?.mediatedDevices,
      },
    },
  ];

  const obj = { loaded, data: hc };
  return (
    <div className="co-m-list">
      <div className="co-m-nav-title">
        <h1>
          {t('kubevirt-plugin~Hardware Devices')}
          <FieldLevelHelp>
            {t(
              'kubevirt-plugin~Various types of hardware devices are assigned to virtual machines in the cluster',
            )}
          </FieldLevelHelp>
        </h1>
      </div>
      <HorizontalNav {...props} pages={pages} match={props.match} obj={obj} />
    </div>
  );
};
