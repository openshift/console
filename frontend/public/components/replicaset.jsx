import React from 'react';

import createListComponent from './list-factory';
import createPageComponent from './page-factory';

import {Header, rowOfKindstring} from './workloads';

const ReplicaSetsList = createListComponent('ReplicaSets', 'REPLICASET', Header, rowOfKindstring('REPLICASET'));
const ReplicaSetsPage = createPageComponent('ReplicaSetsPage', 'REPLICASET', ReplicaSetsList);

export {ReplicaSetsList, ReplicaSetsPage};
