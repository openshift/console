import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OverviewDetailItem } from '@console/internal/components/overview/OverviewDetailItem';
import {
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared/src/components/status/icons';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import { dateFormatter } from '@console/shared/src/utils/datetime';
import type { KubernetesReleasesResponse } from './kubernetes-updates-utils';
import { getKubernetesUpdateInfo } from './kubernetes-updates-utils';

/**
 * Lists newer Kubernetes releases and the end of life of the cluster's minor line.
 * Renders nothing when the bridge has the feature off (404) or the version cannot be parsed.
 */
export const KubernetesUpdatesItem: FC<KubernetesUpdatesItemProps> = ({ gitVersion }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<KubernetesReleasesResponse>();
  const [error, setError] = useState<{ response?: Response }>();

  useEffect(() => {
    coFetchJSON(`${window.SERVER_FLAGS.basePath}api/console/kubernetes-releases`)
      .then(setData)
      .catch(setError);
  }, []);

  const info = getKubernetesUpdateInfo(gitVersion, data?.releases ?? []);
  if (error?.response?.status === 404 || !info) {
    return null;
  }

  return (
    <OverviewDetailItem
      title={info.updateAvailable ? t('public~Update available') : t('public~Kubernetes updates')}
      isLoading={!data && !error}
      error={error ? t('public~Not available') : undefined}
    >
      {info.cycleKnown ? (
        <div>
          {info.latestPatch
            ? t('public~Latest patch for {{cycle}}: v{{version}}', {
                cycle: info.cycle,
                version: info.latestPatch,
              })
            : t('public~Latest patch for {{cycle}}: up to date', { cycle: info.cycle })}
        </div>
      ) : (
        <div>{t('public~No release information for {{cycle}}', { cycle: info.cycle })}</div>
      )}
      {info.latestRelease && (
        <div>{t('public~Latest release: v{{version}}', { version: info.latestRelease })}</div>
      )}
      {info.eol && (
        <div data-test="kubernetes-eol">
          {info.eolStatus === 'danger' && (
            <RedExclamationCircleIcon className="co-icon-space-r" title={t('public~End of life')} />
          )}
          {info.eolStatus === 'warning' && (
            <YellowExclamationTriangleIcon
              className="co-icon-space-r"
              title={t('public~End of life soon')}
            />
          )}
          {t('public~End of life: {{date}}', { date: dateFormatter.format(info.eol) })}
        </div>
      )}
    </OverviewDetailItem>
  );
};

type KubernetesUpdatesItemProps = {
  /** The cluster's gitVersion from /api/kubernetes/version, e.g. "v1.33.2". */
  gitVersion?: string;
};
