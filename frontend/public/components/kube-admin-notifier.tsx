import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Banner, Flex } from '@patternfly/react-core';
import * as _ from 'lodash-es';
import { useTranslation, Trans } from 'react-i18next';

import { KUBE_ADMIN_USERNAMES, useCanClusterUpgrade } from '@console/shared';
import { OAuthModel } from '../models';
import { userStateToProps } from '../reducers/ui';
import { resourcePathFromModel } from './utils/resource-link';
import { CoreState } from '@console/dynamic-plugin-sdk/src/app/redux-types';

const oAuthResourcePath = resourcePathFromModel(OAuthModel, 'cluster');

export const KubeAdminNotifier = connect(userStateToProps)(({ user }: CoreState) => {
  const { t } = useTranslation();
  const canUpgrade = useCanClusterUpgrade();
  const username = _.get(user, 'username');
  return KUBE_ADMIN_USERNAMES.includes(username) && canUpgrade ? (
    <Banner color="blue">
      <Flex justifyContent={{ default: 'justifyContentCenter' }}>
        <p className="pf-v6-u-text-align-center">
          <Trans t={t} ns="public">
            You are logged in as a temporary administrative user. Update the{' '}
            <Link to={oAuthResourcePath}>cluster OAuth configuration</Link> to allow others to log
            in.
          </Trans>
        </p>
      </Flex>
    </Banner>
  ) : null;
});
