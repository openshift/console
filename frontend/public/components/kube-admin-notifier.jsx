import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';

import { KUBE_ADMIN_USERNAME } from '@console/shared';
import { OAuthModel } from '../models';
import { userStateToProps } from '../reducers/ui-selectors';
import { resourcePathFromModel } from './utils/resource-link';

const oAuthResourcePath = resourcePathFromModel(OAuthModel, 'cluster');

export const KubeAdminNotifier = connect(userStateToProps)(({ user }) => {
  const username = _.get(user, 'metadata.name');
  return username === KUBE_ADMIN_USERNAME ? (
    <div className="co-global-notification">
      <div className="co-global-notification__content">
        <p className="co-global-notification__text">
          You are logged in as a temporary administrative user. Update the{' '}
          <Link to={oAuthResourcePath}>cluster OAuth configuration</Link> to allow others to
          log&nbsp;in.
        </p>
      </div>
    </div>
  ) : null;
});
