import * as React from 'react';
import { CogsIcon } from '@patternfly/react-icons';
import { Perspective } from '@console/plugin-sdk';

/* 임시 */
// TODO:  싱글 클러스터 증가시 동적 생성하는 방법 확인
//        getK8sLandingPageURL, getImportRedirectURL 하는 상황 파악 및 수정
const perspectives: Perspective[] = [
    {
        type: 'Perspective',
        properties: {
            id: 'mc',
            name: 'Multi Cluster',
            icon: <CogsIcon />,
            default: true,
            getLandingPageURL: (flags) => '/k8s/cluster/clustermanagers',
            getK8sLandingPageURL: (flags) => '/k8s/cluster/clustermanagers',
            getImportRedirectURL: (project) => `/k8s/cluster/projects/${project}/workloads`,
        },
    },
    {
        type: 'Perspective',
        properties: {
            id: 'hc',
            name: 'Single Cluster',
            icon: <CogsIcon />,
            getLandingPageURL: (flags) => '/dashboards',
            getK8sLandingPageURL: (flags) => '/dashboards',
            getImportRedirectURL: (project) => `/k8s/cluster/projects/${project}/workloads`,
        },
    },
]

export const getPerspectives: () => Perspective[] = () => {
    return perspectives;
}
