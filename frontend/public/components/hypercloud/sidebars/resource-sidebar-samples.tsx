import { Map as ImmutableMap } from 'immutable';
import {
    LimitRangeModel
} from '../../../models';

import {
    apiVersionForModel,
    GroupVersionKind,
    K8sKind,
    referenceForModel,
} from '../../../module/k8s';


const getTargetResource = (model: K8sKind) => ({
    apiVersion: apiVersionForModel(model),
    kind: model.kind,
});


export const hyperCloudSamples = ImmutableMap<GroupVersionKind, Sample[]>()
// hyperCloud Samples description example
// .setIn(
//     [referenceForModel(LimitRangeModel)],
//     [
//         {
//             highlightText: 'Limit Range Uppercase',
//             title: 'Limit Range Model Sample Yaml',
//             img: 'Image File',
//             description: 'Limit Range Model Sample Yaml Description',
//             id: 'sample',
//             targetResource: getTargetResource(LimitRangeModel),
//         },
//     ],
// );

type Sample = {
    highlightText?: string;
    title: string;
    img?: string;
    description: string;
    id: string;
    yaml?: string;
    snippet?: boolean;
    targetResource: {
        apiVersion: string;
        kind: string;
    };
};