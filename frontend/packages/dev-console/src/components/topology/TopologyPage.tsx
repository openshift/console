import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router-dom';
import Topology from '@console/topology/src/components/page/TopologyPage';

export interface TopologyPageProps {
  match: RMatch<{
    name?: string;
  }>;
}

const TopologyPage: React.FC<TopologyPageProps> = ({ match }) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('devconsole~Topology')}</title>
      </Helmet>
      <Topology match={match} />
    </>
  );
};

export default TopologyPage;
