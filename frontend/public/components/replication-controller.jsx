import React from 'react';

import createListComponent from './list-factory';
import createPageComponent from './page-factory';

import {Header, rowOfKindstring} from './workloads';

const RC_ENUM = 'REPLICATIONCONTROLLER';

const ReplicationControllersList = createListComponent('ReplicationControllers', RC_ENUM, Header, rowOfKindstring(RC_ENUM));
const ReplicationControllersPage = createPageComponent('ReplicationControllersPage', RC_ENUM, ReplicationControllersList);

export {ReplicationControllersList, ReplicationControllersPage};
