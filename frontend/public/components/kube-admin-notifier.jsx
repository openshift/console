import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';
import { useTranslation, Trans } from 'react-i18next';

import { KUBE_ADMIN_USERNAMES } from '@console/shared';
import { OAuthModel } from '../models';
import { userStateToProps } from '../reducers/ui';
import { resourcePathFromModel } from './utils/resource-link';

const oAuthResourcePath = resourcePathFromModel(OAuthModel, 'cluster');

export const KubeAdminNotifier = connect(userStateToProps)(({ user }) => {
  const { t } = useTranslation();
  const username = _.get(user, 'metadata.name');
  return KUBE_ADMIN_USERNAMES.includes(username) ? (
    <div className="co-global-notification">
      <div className="co-global-notification__content">
        <p className="co-global-notification__text">
          <Trans t={t} ns="public">
            You are logged in as a temporary administrative user. Update the{' '}
            <Link to={oAuthResourcePath}>cluster OAuth configuration</Link> to allow others to log
            in.
          </Trans>
        </p>
      </div>
    </div>
  ) : null;
});
