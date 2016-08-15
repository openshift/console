import React from 'react';

import createListComponent from './list-factory';
import createPageComponent from './page-factory';

import {Header, rowOfKindstring} from './workloads';

const DeploymentList = createListComponent('Deployments', 'DEPLOYMENT', Header, rowOfKindstring('DEPLOYMENT'));
const DeploymentsPage = createPageComponent('DeploymentsPage', 'DEPLOYMENT', DeploymentList);

export {DeploymentList, DeploymentsPage};
