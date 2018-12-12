import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';

import { userStateToProps } from '../ui/ui-reducers';
import { KUBE_ADMIN_USERNAME } from '../const';

export const KubeAdminNotifier = connect(userStateToProps)(({user}) => {
  const username = _.get(user, 'metadata.name');
  return username === KUBE_ADMIN_USERNAME
    ? <div className="co-global-notification">
      <div className="co-global-notification__content">
        <p className="co-global-notification__text">
          You are logged in as a temporary administrative user. Set up an identity provider to allow others to log in.
        </p>
      </div>
    </div>
    : null;
});
