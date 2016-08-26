import React from 'react';

import {makeListPage, makeList} from './factory';
import {Header, rowOfKindstring} from './workloads';

const ReplicaSetsList = makeList('ReplicaSets', 'REPLICASET', Header, rowOfKindstring('REPLICASET'));
const ReplicaSetsPage = makeListPage('ReplicaSetsPage', 'REPLICASET', ReplicaSetsList);

export {ReplicaSetsList, ReplicaSetsPage};
