import type { FC } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import TopologyApplicationResourceList from './TopologyApplicationList';

const MAX_RESOURCES = 5;

type ApplicationGroupResourceProps = {
  title: string;
  resourcesData: K8sResourceKind[];
  group: string;
};

const ApplicationGroupResource: FC<ApplicationGroupResourceProps> = ({
  title,
  resourcesData,
  group,
}) => {
  const { t } = useTranslation('topology');
  const [activeNamespace] = useActiveNamespace();
  return !_.isEmpty(resourcesData) ? (
    <div className="overview__sidebar-pane-body">
      <SidebarSectionHeading text={title}>
        {_.size(resourcesData) > MAX_RESOURCES && (
          <Link
            className="sidebar__section-view-all"
            to={`/search/ns/${activeNamespace}?kind=${referenceFor(
              resourcesData[0],
            )}&q=${encodeURIComponent(`app.kubernetes.io/part-of=${group}`)}`}
          >
            {t('View all {{size}}', { size: _.size(resourcesData) })}
          </Link>
        )}
      </SidebarSectionHeading>
      <TopologyApplicationResourceList resources={_.take(resourcesData, MAX_RESOURCES)} />
    </div>
  ) : null;
};

export default ApplicationGroupResource;
