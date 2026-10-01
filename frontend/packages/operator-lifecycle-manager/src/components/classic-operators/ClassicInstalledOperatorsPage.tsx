import type { FC } from 'react';
import { useParams } from 'react-router';
import { ClusterServiceVersionsPage } from '../clusterserviceversion';
import { ClassicOperatorMigrationAlert } from './ClassicOperatorMigrationAlert';

/**
 * Classic (OLMv0) tab of the Installed Operators page. The tabbed page owns the NamespaceBar and
 * the page heading, so the list renders without its own title.
 */
const ClassicInstalledOperatorsPage: FC = () => {
  const { ns } = useParams<{ ns?: string }>();

  return (
    <ClusterServiceVersionsPage
      namespace={ns ?? ''}
      showTitle={false}
      helpAlert={<ClassicOperatorMigrationAlert />}
    />
  );
};

export default ClassicInstalledOperatorsPage;
