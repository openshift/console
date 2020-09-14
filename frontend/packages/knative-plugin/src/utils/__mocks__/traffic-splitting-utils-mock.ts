import * as _ from 'lodash';
import {
  knativeServiceObj,
  revisionObj,
} from '../../topology/__tests__/topology-knative-test-data';
import { RevisionKind, ServiceKind as knativeServiceKind, Traffic } from '../../types';

export const mockServiceData: knativeServiceKind = _.cloneDeep(knativeServiceObj);

export const mockTrafficData: Traffic[] = [
  { percent: 25, tag: 'tag-1', revisionName: 'overlayimage-fdqsf' },
  { percent: 25, tag: 'tag-2', revisionName: 'overlayimage-tkvz5' },
  { percent: 25, tag: 'tag-3', revisionName: 'overlayimage-bwpxq' },
  { percent: 25, tag: 'tag-4', revisionName: 'overlayimage-n2b7n' },
];

export const mockUpdateRequestObj: knativeServiceKind = _.set(
  _.omit(_.cloneDeep(knativeServiceObj), 'status'),
  'spec.traffic',
  mockTrafficData,
);

export const mockRevisions: RevisionKind[] = [
  revisionObj,
  _.set(_.cloneDeep(revisionObj), 'metadata.name', 'overlayimage-tkvz5'),
  _.set(_.cloneDeep(revisionObj), 'metadata.name', 'overlayimage-bwpxq'),
  _.set(_.cloneDeep(revisionObj), 'metadata.name', 'overlayimage-n2b7n'),
];

export const mockRevisionItems = {
  'overlayimage-fdqsf': 'overlayimage-fdqsf',
  'overlayimage-tkvz5': 'overlayimage-tkvz5',
  'overlayimage-bwpxq': 'overlayimage-bwpxq',
  'overlayimage-n2b7n': 'overlayimage-n2b7n',
};
