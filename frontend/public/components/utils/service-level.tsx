import * as React from 'react';
import { Alert, Skeleton, Label } from '@patternfly/react-core';
import { NotificationEntry, NotificationTypes } from '@console/patternfly';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import * as UIActions from '@console/internal/actions/ui';
import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import { YellowExclamationTriangleIcon, RedExclamationCircleIcon } from '@console/shared';
import { getDuration, dateFormatter } from './datetime';
import { getOCMLink } from '../../module/k8s';
import { k8sGet } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { SecretModel } from '../../models';
import { ExternalLink, FieldLevelHelp } from './index';
import { RootState } from '../../redux';

const useServiceLevelText = (level: string): string => {
  const { t } = useTranslation();
  const levels = {
    Premium: t('public~Premium'),
    Standard: t('public~Standard'),
    'Self-Support': t('public~Self-support'),
    Eval: t('public~Self-support, 60 day trial'),
    None: t('public~None'), // Eval has ended
    Unknown: t('public~Unknown'), // Not officially returned from the API, but is used when no results are returned from the API
  };

  if (!level) {
    return levels.Unknown;
  }
  return levels[level] || level;
};

const showServiceLevel = (clusterID: string) =>
  clusterID &&
  window.SERVER_FLAGS.branding !== 'okd' &&
  window.SERVER_FLAGS.branding !== 'azure' &&
  window.SERVER_FLAGS.branding !== 'dedicated';

const TrialDaysLeft: React.FC<{
  level: string;
  trialDaysLeft: number | null;
  label?: boolean;
}> = ({ level, trialDaysLeft, label }) => {
  const { t } = useTranslation();

  if ((level !== 'Eval' && level !== 'None') || (level === 'Eval' && trialDaysLeft === null)) {
    return null;
  }

  let variant: 'warning' | 'danger' = 'warning';

  let alertText = t('public~{{count}} day remaining', { count: trialDaysLeft });
  if (trialDaysLeft === 0) {
    alertText = t('public~< 1 day remaining');
  }

  if (trialDaysLeft < 0 || level === 'None') {
    variant = 'danger';
    alertText = t('public~Trial expired');
  }

  if (label) {
    return (
      <div>
        <Label
          color={variant === 'warning' ? 'orange' : 'red'}
          icon={
            variant === 'warning' ? <YellowExclamationTriangleIcon /> : <RedExclamationCircleIcon />
          }
        >
          {alertText}
        </Label>
      </div>
    );
  }
  return (
    <Alert
      className="co-alert-inline--no-bold-title"
      variant={variant}
      isInline
      isPlain
      title={alertText}
    />
  );
};

const useLoadServiceLevel = (): [boolean, boolean, (clusterID: string) => void] => {
  const dispatch = useDispatch();
  const [loadingSecret, setLoadingSecret] = React.useState(false);
  const [loadingServiceLevel, setLoadingServiceLevel] = React.useState(false);

  let hasSecretAccess = false;

  const loadServiceLevel = (clusterID: string): void => {
    if (!showServiceLevel(clusterID)) {
      setLoadingSecret(false);
      setLoadingServiceLevel(false);
      dispatch(UIActions.setServiceLevel(null, null, clusterID, null, hasSecretAccess));
      return;
    }
    setLoadingSecret(true);
    k8sGet({ model: SecretModel, name: 'pull-secret', ns: 'openshift-config' })
      .then((response) => {
        // @ts-ignore  Data is not recognized as part of response.
        const secret = JSON.parse(atob(response.data['.dockerconfigjson']));
        const token = secret.auths['cloud.openshift.com'].auth;
        const headers = {
          Authorization: `AccessToken ${clusterID}:${token}`,
        };
        const apiUrl = `/api/accounts_mgmt/v1/subscriptions?page=1&search=external_cluster_id%3D%27${clusterID}%27`;
        setLoadingSecret(false);
        if (!token) {
          throw new Error('Pull secret token is empty');
        }
        setLoadingServiceLevel(true);
        hasSecretAccess = true;

        consoleFetchJSON(apiUrl, 'GET', {
          headers,
        })
          .then((ocmResponse) => {
            if (!ocmResponse.items || ocmResponse.items?.length === 0) {
              throw new Error('Cluster ID used to get support level was not recognized');
            }

            const levelSetting = ocmResponse.items[0].support_level;
            const expirationDate = ocmResponse.items[0].eval_expiration_date;

            const trialEnd = expirationDate ? new Date(expirationDate) : null;
            const now = new Date();
            let daysLeft = trialEnd ? getDuration(trialEnd.getTime() - now.getTime()).days : null;

            daysLeft = trialEnd.getTime() < now.getTime() ? -1 : daysLeft;

            const trialDateEnd = trialEnd ? dateFormatter.format(trialEnd) : null;
            dispatch(
              UIActions.setServiceLevel(
                levelSetting,
                daysLeft,
                clusterID,
                trialDateEnd,
                hasSecretAccess,
              ),
            );
          })
          .catch((err) => {
            dispatch(UIActions.setServiceLevel(null, null, clusterID, null, hasSecretAccess));
            // eslint-disable-next-line no-console
            console.error('API call to get support level has failed', err);
          })
          .finally(() => {
            // done trying to get service level
            setLoadingServiceLevel(false);
          });
      })
      .catch(() => {
        // Error getting pull secret (this is expected if the user doesn't have access)
        setLoadingSecret(false);
        dispatch(UIActions.setServiceLevel(null, null, clusterID, null, hasSecretAccess));
      });
  };

  return [loadingSecret, loadingServiceLevel, loadServiceLevel];
};
const useGetServiceLevel = (
  clusterIDParam: string,
): {
  level: string;
  daysRemaining: number | null;
  trialDateEnd: string;
  hasSecretAccess: boolean;
  loadingSecret: boolean;
  loadingServiceLevel: boolean;
} => {
  const {
    level,
    daysRemaining,
    clusterID,
    trialDateEnd,
    hasSecretAccess,
  } = useSelector(({ UI }: RootState) => UI.get('serviceLevel'));
  const [loadingSecret, loadingServiceLevel, loadServiceLevel] = useLoadServiceLevel();

  React.useEffect(() => {
    if (clusterID !== clusterIDParam) {
      // only load if clusterID passed is different than what is in Redux store
      loadServiceLevel(clusterIDParam);
    }
    // only on clusterID change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterIDParam]);

  return {
    level,
    daysRemaining,
    trialDateEnd,
    hasSecretAccess,
    loadingSecret,
    loadingServiceLevel,
  };
};

export const ServiceLevel: React.FC<{ clusterID: string; children: React.ReactNode }> = ({
  clusterID,
  children,
}) => {
  const { hasSecretAccess, loadingSecret, loadingServiceLevel } = useGetServiceLevel(clusterID);

  if (!showServiceLevel(clusterID)) {
    return null;
  }
  if (loadingSecret || !hasSecretAccess) {
    return null;
  }
  if (!loadingSecret && loadingServiceLevel) {
    return <Skeleton />;
  }

  return <>{children}</>;
};
type ServiceLevelTextProps = {
  clusterID?: string;
  inline?: boolean;
};
export const ServiceLevelText: React.FC<ServiceLevelTextProps> = ({ clusterID, inline }) => {
  const { t } = useTranslation();
  const { level, daysRemaining } = useGetServiceLevel(clusterID);
  const levelText = (
    <>
      {useServiceLevelText(level)}
      {!inline && !level ? (
        <FieldLevelHelp>
          {t(
            'public~API failed to return the Service Level Agreement setting for this cluster.  Check again later.',
          )}
        </FieldLevelHelp>
      ) : null}
    </>
  );
  if (inline) {
    return (
      <>
        {levelText}
        <TrialDaysLeft level={level} trialDaysLeft={daysRemaining} label />
      </>
    );
  }
  return (
    <>
      <div className="co-select-to-copy">
        {levelText}
        <div>
          <TrialDaysLeft level={level} trialDaysLeft={daysRemaining} />
        </div>
      </div>
      {!inline ? (
        <div>
          <ExternalLink
            text={t('public~Manage subscription settings')}
            href={getOCMLink(clusterID)}
          />
        </div>
      ) : null}
    </>
  );
};
export const useServiceLevelTitle = (): string => {
  const { t } = useTranslation();
  return t('public~Service Level Agreement (SLA)');
};

export const ServiceLevelNotification: React.FC<{
  clusterID?: string;
  toggleNotificationDrawer: () => void;
}> = ({ clusterID, toggleNotificationDrawer }) => {
  const { t } = useTranslation();
  const { level, daysRemaining, trialDateEnd } = useGetServiceLevel(clusterID);

  if (!level || (level !== 'Eval' && level !== 'None')) {
    return null;
  }
  let notificationStart = '';
  if (level === 'None' || (level === 'Eval' && daysRemaining < 0)) {
    notificationStart = t('public~Your 60-day self-support trial expired.');
  }

  notificationStart =
    daysRemaining === 0
      ? t('public~Your 60-day self-support trial will end in < 1 day.')
      : t('public~Your 60-day self-support trial will end in {{count}} day on {{date}}.', {
          count: daysRemaining,
          date: trialDateEnd,
        });

  return (
    <NotificationEntry
      title={t('public~This cluster is not supported.')}
      actionExternalLinkURL={getOCMLink(clusterID)}
      actionText={t('public~Get support')}
      toggleNotificationDrawer={toggleNotificationDrawer}
      description={
        <>
          {`${notificationStart} ${t(
            'public~For continued support, upgrade your cluster or transfer cluster ownership to an account with an active subscription.',
          )}`}
        </>
      }
      type={NotificationTypes.warning}
    />
  );
};
