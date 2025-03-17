import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Title } from '@console/shared/src/components/title/Title';
import Topology from '@console/topology/src/components/page/TopologyPage';

const TopologyPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <Title>{t('devconsole~Topology')}</Title>
      <Topology />
    </>
  );
};

export default TopologyPage;
