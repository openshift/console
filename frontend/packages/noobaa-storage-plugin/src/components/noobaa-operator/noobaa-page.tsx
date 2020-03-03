import * as React from 'react';
import { match } from 'react-router';
import * as _ from 'lodash';
import {
  Firehose,
  FirehoseResult,
  HorizontalNav,
  PageHeading,
  FirehoseResource,
  resourcePathFromModel,
  BreadCrumbs,
} from '@console/internal/components/utils';
import { referenceForModel, k8sGet } from '@console/internal/module/k8s';
import { EditYAML } from '@console/internal/components/edit-yaml';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { NooBaaSystemModel } from '../../models';
import InfoPage from './infoPage';
import MCGResourceList from './resourceTable';

const getFireHoseResources = (namespace: string): FirehoseResource[] => {
  const system = {
    kind: referenceForModel(NooBaaSystemModel),
    namespace,
    prop: 'obj',
    isList: false,
    name: 'noobaa',
  };
  return [system];
};

const pages = [
  {
    href: '',
    name: 'Details Page',
    component: InfoPage,
  },
  {
    href: 'yaml',
    name: 'YAML',
    component: EditYAML,
  },
  {
    href: 'resources',
    path: 'resources',
    name: 'Resources',
    component: MCGResourceList,
  },
];

const NooBaaPage: React.FC<NooBaaPageProps> = (props) => {
  const { ns: namespace, appName } = props.match.params;
  const resources = getFireHoseResources(namespace);
  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);

  React.useEffect(() => {
    k8sGet(ClusterServiceVersionModel, appName, namespace)
      .then((clusterServiceVersionObj) => {
        setClusterServiceVersion(clusterServiceVersionObj);
      })
      .catch(() => setClusterServiceVersion(null));
  }, [appName, namespace]);

  return (
    <>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
          <BreadCrumbs
            breadcrumbs={[
              {
                name: _.get(
                  clusterServiceVersion,
                  'spec.displayName',
                  'Openshift Container Storage Operator',
                ),
                path: resourcePathFromModel(ClusterServiceVersionModel, appName, namespace),
              },
              { name: 'Multi Cloud Gateway', path: props.match.url },
            ]}
          />
        </div>
        <Firehose resources={resources}>
          <PageHeading title="Multi Cloud Gateway" kind={referenceForModel(NooBaaSystemModel)} />
        </Firehose>
      </div>
      <Firehose resources={resources}>
        <HorizontalNav pages={pages} match={props.match} customData={{ namespace }} />
      </Firehose>
    </>
  );
};

type NooBaaPageProps = {
  match: match<{ ns: string; appName: string }>;
  obj?: FirehoseResult;
};

export default NooBaaPage;
