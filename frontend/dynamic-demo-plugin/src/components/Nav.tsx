import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { HorizontalNav } from '@openshift-console/dynamic-plugin-sdk';

const Thor: React.FC = () => (
  <div>
    <h1> Hello Earth! I am Thor!</h1>
  </div>
);

const Loki: React.FC = () => (
  <div>
    <h1> Hello Earth! I am Loki!</h1>
  </div>
);

const Asgard: React.FC<RouteComponentProps> = () => {
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
  return <HorizontalNav pages={pages} />;
};

export default Asgard;
