import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import Topology from '@console/topology/src/components/page/TopologyPage';

const TopologyPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('devconsole~Topology')}</title>
      </Helmet>
      <Topology />
    </>
  );
};

export default TopologyPage;
