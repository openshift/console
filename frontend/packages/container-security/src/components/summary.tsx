import * as React from 'react';
import { ChartDonut } from '@patternfly/react-charts';
import { pluralize } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { WatchK8sResults } from '@console/internal/components/utils/k8s-watch-hook';
import { ExternalLink } from '@console/internal/components/utils/link';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceHealthHandler } from '@console/plugin-sdk';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { vulnPriority, priorityFor } from '../const';
import { ImageManifestVulnModel } from '../models';
import { ImageManifestVuln, WatchImageVuln } from '../types';

export const securityHealthHandler: ResourceHealthHandler<WatchImageVuln> = ({
  imageManifestVuln,
}) => {
  const { data, loaded, loadError } = imageManifestVuln;

  if (loadError) {
    return { state: HealthState.UNKNOWN, message: 'Not available' };
  }
  if (!loaded) {
    return {
      state: HealthState.LOADING,
      message: 'Scanning in progress',
    };
  }
  if (!_.isEmpty(data)) {
    return {
      state: HealthState.ERROR,
      message: pluralize(_.uniqBy(data, 'metadata.name').length, 'vulnerable image'),
    };
  }
  return { state: HealthState.OK, message: '0 vulnerable images' };
};

export const quayURLFor = (vuln: ImageManifestVuln) => {
  const base = vuln.spec.image
    .replace('@sha256', '')
    .split('/')
    .reduce((url, part, i) => [...url, part, ...(i === 0 ? ['repository'] : [])], [])
    .join('/');
  return `//${base}/manifest/${vuln.spec.manifest}?tab=vulnerabilities`;
};

export const SecurityBreakdownPopup: React.FC<SecurityBreakdownPopupProps> = ({
  imageManifestVuln,
  namespace,
}) => {
  const { t } = useTranslation();
  const resource = imageManifestVuln.data;
  const vulnsFor = (severity: string) =>
    resource.filter((v) => v.status?.highestSeverity === severity);
  const fixableVulns = resource
    .filter((v) => v.status?.fixableCount > 0)
    .reduce((all, v) => all.set(v.metadata.name, v), new Map<string, ImageManifestVuln>());
  const getVulnerabilityCountText = (v: ImageManifestVuln): string => {
    const {
      fixableCount = 0,
      highCount = 0,
      mediumCount = 0,
      lowCount = 0,
      unknownCount = 0,
    } = v.status;
    const totalCount = highCount + mediumCount + lowCount + unknownCount;
    return t('container-security~{{fixableCount, number}} of {{totalCount, number}} fixable', {
      fixableCount,
      totalCount,
    });
  };
  const imageNameClamped = (imageName: string): string =>
    imageName.length > 25 ? `${imageName.slice(0, 25)}...` : imageName;
  const baseVulnListUrl = namespace
    ? `/k8s/cluster/projects/${namespace}/vulnerabilities`
    : `/k8s/all-namespaces/${referenceForModel(ImageManifestVulnModel)}`;
  const vulnDetailsUrl = `/k8s/ns/${namespace}/${referenceForModel(ImageManifestVulnModel)}`;

  return (
    <>
      <div className="co-status-popup__description">
        {namespace
          ? t(
              `container-security~This project's container images from Quay are analyzed to identify vulnerabilities. Images from other registries are not scanned.`,
            )
          : t(
              'container-security~Container images from Quay are analyzed to identify vulnerabilities. Images from other registries are not scanned.',
            )}
      </div>
      {!_.isEmpty(resource) ? (
        <>
          <div className="co-status-popup__section">
            <div className="co-status-popup__row">
              <div className="co-status-popup__text--bold">
                {t('container-security~Vulnerable Container Images')}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '66%', marginRight: '24px' }}>
                {vulnPriority
                  .map((priority) =>
                    !_.isEmpty(vulnsFor(priority.value)) ? (
                      <div className="co-status-popup__row" key={priority.value}>
                        <div>
                          <ExclamationTriangleIcon
                            color={priority.color.value}
                            title={priority.title}
                          />
                          &nbsp;
                          {_.uniqBy(vulnsFor(priority.value), 'metadata.name').length}{' '}
                          {priority.title}
                        </div>
                      </div>
                    ) : null,
                  )
                  .toArray()}
              </div>
              <div>
                <Link to={baseVulnListUrl} aria-label={t('container-security~View all')}>
                  <ChartDonut
                    colorScale={vulnPriority.map((priority) => priority.color.value).toArray()}
                    data={vulnPriority
                      .map((priority) => ({
                        label: priority.title,
                        x: priority.value,
                        y: _.uniqBy(vulnsFor(priority.value), 'metadata.name').length,
                      }))
                      .toArray()}
                    title={t('container-security~{{vulnImageCount, number}} total', {
                      vulnImageCount: _.uniqBy(resource, 'metadata.name').length,
                    })}
                  />
                </Link>
              </div>
            </div>
          </div>
          {!_.isEmpty(fixableVulns) && (
            <div className="co-status-popup__section">
              <div className="co-status-popup__row">
                <div>
                  <span className="co-status-popup__text--bold">
                    {t('container-security~Fixable Container Images')}
                  </span>
                  <span className="text-secondary">
                    &nbsp;
                    {t('container-security~{{vulnImageCount, number}} total', {
                      vulnImageCount: fixableVulns.size,
                    })}
                  </span>
                </div>
              </div>
              <div className="co-status-popup__row">
                <span className="co-status-popup__text--bold">
                  {namespace ? t('container-security~Image') : t('container-security~Impact')}
                </span>
                <span className="co-status-popup__text--bold">
                  {t('container-security~Vulnerabilities')}
                </span>
              </div>
              {_.sortBy(_.take([...fixableVulns.values()], 5), [
                (v) => priorityFor(v.status?.highestSeverity).index,
              ]).map((v) => (
                <div className="co-status-popup__row" key={v.metadata.name}>
                  <span>
                    <ExclamationTriangleIcon
                      color={priorityFor(v.status?.highestSeverity).color.value}
                    />{' '}
                    <Link
                      to={
                        namespace
                          ? `${vulnDetailsUrl}/${v.metadata.name}`
                          : `${baseVulnListUrl}?name=${v.metadata.name}`
                      }
                    >
                      {namespace
                        ? imageNameClamped(v.spec.image)
                        : pluralize(
                            resource.filter(({ metadata }) => metadata.name === v.metadata.name)
                              .length,
                            'namespace',
                          )}
                    </Link>
                  </span>
                  <div className="text-secondary">
                    <ExternalLink href={quayURLFor(v)} text={getVulnerabilityCountText(v)} />
                  </div>
                </div>
              ))}
              <div className="co-status-popup__row">
                <Link
                  to={{
                    pathname: baseVulnListUrl,
                    search: '?orderBy=desc&sortBy=Fixable',
                  }}
                >
                  {t('container-security~View all')}
                </Link>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="co-status-popup__section">
          <span className="text-secondary">
            {t('container-security~No vulnerabilities detected.')}
          </span>
        </div>
      )}
    </>
  );
};

export type SecurityBreakdownPopupProps = WatchK8sResults<WatchImageVuln> & { namespace?: string };

SecurityBreakdownPopup.displayName = 'SecurityBreakdownPopup';
