import * as React from 'react';
import { HorizontalNav } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { PageSection, Title } from '@patternfly/react-core';

type Hero = {
  customData: {
    planet: string;
  };
}

const Thor: React.FC<Hero> = ( {customData} ) => {
  const { t } = useTranslation("plugin__console-demo-plugin");

  return <PageSection>
    <Title headingLevel='h1'>{t('Hello {{planet}}! I am Thor!',  { planet: customData.planet })}</Title>
  </PageSection>
};

const Loki: React.FC<Hero> = ( {customData} ) => {
  const { t } = useTranslation("plugin__console-demo-plugin");

  return <PageSection>
    <Title headingLevel='h1'>{t('Hello {{planet}}! I am Loki!', { planet: customData.planet })}</Title>
    </PageSection>
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
