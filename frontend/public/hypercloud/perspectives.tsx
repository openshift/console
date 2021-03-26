import * as React from 'react';
import { CogsIcon } from '@patternfly/react-icons';
import { Perspective } from '@console/plugin-sdk';
import { TFunction } from 'i18next';

/* 임시 */
// TODO:  싱글 클러스터 증가시 동적 생성하는 방법 확인
//        getK8sLandingPageURL, getImportRedirectURL 하는 상황 파악 및 수정
export const getPerspectives: (t?: TFunction) => Perspective[] = (t?: TFunction) => {
  return [
    {
      type: 'Perspective',
      properties: {
        id: 'mc',
        name: t ? t('COMMON:MSG_LNB_MENU_CONSOLE_LIST_2') : 'Multi-Cluster',
        icon: <CogsIcon />,
        default: true,
        getLandingPageURL: flags => '/k8s/cluster/clustermanagers',
        getK8sLandingPageURL: flags => '/k8s/cluster/clustermanagers',
        getImportRedirectURL: project => `/k8s/cluster/projects/${project}/workloads`,
      },
    },
    {
      type: 'Perspective',
      properties: {
        id: 'master',
        name: t ? t('COMMON:MSG_LNB_MENU_CONSOLE_LIST_3') : 'Master-Cluster',
        icon: <CogsIcon />,
        getLandingPageURL: flags => (localStorage.getItem('flag/first-time-login') ? '/master/dashboards' : '/welcome'),
        getK8sLandingPageURL: flags => (localStorage.getItem('flag/first-time-login') ? '/master/dashboards' : '/welcome'),
        getImportRedirectURL: project => `/k8s/cluster/projects/${project}/workloads`,
      },
    },
    {
      type: 'Perspective',
      properties: {
        id: 'hc',
        name: t ? t('COMMON:MSG_LNB_MENU_CONSOLE_LIST_1') : 'Single-Cluster',
        icon: <CogsIcon />,
        getLandingPageURL: flags => (localStorage.getItem('flag/first-time-login') ? '/single/dashboards' : '/welcome'),
        getK8sLandingPageURL: flags => (localStorage.getItem('flag/first-time-login') ? '/single/dashboards' : '/welcome'),
        getImportRedirectURL: project => `/k8s/cluster/projects/${project}/workloads`,
      },
    },
  ];
};
