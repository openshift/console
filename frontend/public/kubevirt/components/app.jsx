import './init';

import * as React from 'react';
import {Redirect} from 'react-router-dom';

import { connectToFlags, flagPending, FLAGS } from '../../features';
import {NamespaceRedirect} from './okdcomponents';
import {Loading} from './utils/okdutils';

export const KubevirtDefaultPage = connectToFlags(FLAGS.KUBEVIRT)(({ flags }) => {
  const kubevirtFlag = flags[FLAGS.KUBEVIRT];
  if (flagPending(kubevirtFlag)) {
    return <Loading />;
  }

  if (kubevirtFlag) {
    return <Redirect to="/k8s/all-namespaces/virtualmachines" />;
  }

  return <NamespaceRedirect />;
});
