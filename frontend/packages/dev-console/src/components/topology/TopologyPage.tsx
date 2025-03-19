import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import Topology from '@console/topology/src/components/page/TopologyPage';

const TopologyPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <DocumentTitle>{t('devconsole~Topology')}</DocumentTitle>
      <Topology />
    </>
  );
};

export default TopologyPage;
