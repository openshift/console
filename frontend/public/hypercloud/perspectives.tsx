import * as React from 'react';
import { CogsIcon, CloudTenantIcon } from '@patternfly/react-icons';
import { FlagsObject } from '@console/internal/reducers/features';

/* 임시 */
// TODO:  싱글 클러스터 증가시 동적 생성하는 방법 확인
//        getK8sLandingPageURL, getImportRedirectURL 하는 상황 파악 및 수정
const perspectives: Perspective[] = [
    {
        type: 'Perspective',
        properties: {
            id: 'mc',
            name: 'MultiCluster',
            icon: <CogsIcon />,
            default: true,
            getLandingPageURL: (flags) => '/k8s/cluster/hyperclusterresources',
            getK8sLandingPageURL: (flags) => '/search',
            getImportRedirectURL: (project) => `/k8s/cluster/projects/${project}/workloads`,
        },
    },
    {
        type: 'Perspective',
        properties: {
            id: 'hc',
            name: 'HyperCloud',
            icon: <CloudTenantIcon />,
            getLandingPageURL: (flags, cluster) => cluster && cluster !== '#MASTER_CLUSTER#' ? `/cl/${cluster}/dashboards` : '/dashboards',
            getK8sLandingPageURL: (flags, cluster) => cluster && cluster !== '#MASTER_CLUSTER#' ? `/cl/${cluster}/search` : '/search',
            getImportRedirectURL: (project, cluster) => cluster && cluster !== '#MASTER_CLUSTER#' ? `/k8s/cl/${cluster}/cluster/projects/${project}/workloads` : `/k8s/cluster/projects/${project}/workloads`,
        },
    },
]

export const getPerspectives: () => Perspective[] = () => {
    return perspectives;
}

export type Extension<P = any> = {
    type: string;
    properties: P;
    flags?: Partial<{
        required: string[];
        disallowed: string[];
    }>;
};

namespace ExtensionProperties {
    export interface Perspective {
        /** The perspective identifier. */
        id: string;
        /** The perspective display name. */
        name: string;
        /** The perspective display icon. */
        icon: React.ReactElement;
        /** Whether the perspective is the default. There can only be one default. */
        default?: boolean;
        /** Default pinned resources on the nav */
        defaultPins?: string[];
        /** The function to get perspective landing page URL. */
        getLandingPageURL: GetLandingPage;
        /** The function to get perspective landing page URL for k8s. */
        getK8sLandingPageURL: GetLandingPage;
        /** The function to get redirect URL for import flow. */
        getImportRedirectURL: (project: string, cluster?: string) => string;
    }
}

export interface Perspective extends Extension<ExtensionProperties.Perspective> {
    type: 'Perspective';
}

export const isPerspective = (e: Extension): e is Perspective => {
    return e.type === 'Perspective';
};

export type GetLandingPage = (flags: FlagsObject, cluster?: string) => string;