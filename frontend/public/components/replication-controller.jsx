import React from 'react';

import {makeListPage, makeList} from './factory';
import {Header, rowOfKindstring} from './workloads';

const RC_ENUM = 'REPLICATIONCONTROLLER';

const ReplicationControllersList = makeList('ReplicationControllers', RC_ENUM, Header, rowOfKindstring(RC_ENUM));
const ReplicationControllersPage = makeListPage('ReplicationControllersPage', RC_ENUM, ReplicationControllersList);

export {ReplicationControllersList, ReplicationControllersPage};
