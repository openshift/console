import { Map as ImmutableMap } from 'immutable';

import { GroupVersionKind } from '../../module/k8s';
// import { referenceForModel } from '../../module/k8s'
// import * as k8sModels from '..';

export const hyperCloudTemplates = ImmutableMap<GroupVersionKind, ImmutableMap<string, string>>()
// HyperCloud yaml templates example
//     .setIn(
//         [referenceForModel(k8sModels.LimitRangeModel), 'sample'],
//         `
// apiVersion: v1
// kind: LimitRange-sample
// metadata:
//   name: mem-limit-range-sample-haha
// spec:
//   limits:
//   - default:
//       memory: 512Mi
//     defaultRequest:
//       memory: 256Mi
//     type: Container
// `,
//     );