import * as _ from 'lodash';
import { KebabOption } from '@console/internal/components/utils/kebab';
import { modelFor } from '@console/internal/module/k8s';
import { asAccessReview } from '@console/internal/components/utils';
import { TopologyDataMap, TopologyApplicationObject } from '../topology-types';
import { getResourceDeploymentObject } from '../topology-utils';
import { deleteApplicationModal } from '../../modals';
import { cleanUpWorkload } from '../../../utils/application-utils';

export const getGroupComponents = (
  groupId: string,
  topology: TopologyDataMap,
): TopologyApplicationObject => {
  return _.values(topology).reduce(
    (acc, val) => {
      const dc = getResourceDeploymentObject(val);
      if (_.get(dc, ['metadata', 'labels', 'app.kubernetes.io/part-of']) === groupId) {
        acc.resources.push(topology[dc.metadata.uid]);
      }
      return acc;
    },
    { id: groupId, name: groupId, resources: [] },
  );
};

const deleteGroup = (application: TopologyApplicationObject) => {
  // accessReview needs a resource but group is not a k8s resource,
  // so currently picking the first resource to do the rbac checks (might change in future)
  const primaryResource = _.get(application.resources[0], ['resources', 'obj']);
  return {
    label: 'Delete Application Group',
    callback: () => {
      const reqs = [];
      deleteApplicationModal({
        blocking: true,
        initialApplication: application.name,
        onSubmit: () => {
          application.resources.forEach((workload) => {
            const resource = _.get(workload, ['resources', 'obj']);
            reqs.push(cleanUpWorkload(resource, workload));
          });
          return Promise.all(reqs);
        },
      });
    },
    accessReview: asAccessReview(modelFor(primaryResource.kind), primaryResource, 'delete'),
  };
};

export const groupActions = (application: TopologyApplicationObject): KebabOption[] => {
  return [deleteGroup(application)];
};
