import React from 'react';

import {makeListPage, makeList} from './factory';
import {Header, rowOfKindstring} from './workloads';

const DeploymentList = makeList('Deployments', 'DEPLOYMENT', Header, rowOfKindstring('DEPLOYMENT'));
const DeploymentsPage = makeListPage('DeploymentsPage', 'DEPLOYMENT', DeploymentList);

export {DeploymentList, DeploymentsPage};
