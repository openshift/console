import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';
import { useTranslation, Trans } from 'react-i18next';

import { KUBE_ADMIN_USERNAMES, useCanClusterUpgrade } from '@console/shared';
import { OAuthModel } from '../models';
import { userStateToProps } from '../reducers/ui';
import { resourcePathFromModel } from './utils/resource-link';
import { useActiveCluster } from '@console/shared/src/hooks/useActiveCluster';

export const KubeAdminNotifier = connect(userStateToProps)(({ user }) => {
  const { t } = useTranslation();
  const [cluster] = useActiveCluster();
  const canUpgrade = useCanClusterUpgrade();
  const username = _.get(user, 'metadata.name');
  const oAuthResourcePath = resourcePathFromModel(OAuthModel, 'cluster', undefined, cluster);
  return KUBE_ADMIN_USERNAMES.includes(username) && canUpgrade ? (
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
