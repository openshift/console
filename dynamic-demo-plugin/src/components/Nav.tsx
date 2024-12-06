import * as React from 'react';
import { HorizontalNav } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';

type Hero = {
  customData: {
    planet: string;
  };
}

const Thor: React.FC<Hero> = ( {customData} ) => {
  const { t } = useTranslation();

  return <div>
    <h1>{t('plugin__console-demo-plugin~Hello {{planet}}! I am Thor!',  { planet: customData.planet })}</h1>
  </div>
};

const Loki: React.FC<Hero> = ( {customData} ) => {
  const { t } = useTranslation();

  return <div>
    <h1>{t('plugin__console-demo-plugin~Hello {{planet}}! I am Loki!', { planet: customData.planet })}</h1>
    </div>
};

const Asgard: React.FC = () => {
  const pages = [
    {
      href: '',
      name: 'Thor',
      component: Thor,
    },
    {
      href: 'loki',
      name: 'Loki',
      component: Loki,
    },
  ];
  return <HorizontalNav pages={pages} customData={{planet: 'Earth'}}/>;
};

export default Asgard;