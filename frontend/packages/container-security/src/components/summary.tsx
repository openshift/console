import * as React from 'react';
import * as _ from 'lodash';
import { pluralize } from '@patternfly/react-core';
import { ChartDonut } from '@patternfly/react-charts';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { ResourceHealthHandler } from '@console/plugin-sdk';
import { WatchK8sResults } from '@console/internal/components/utils/k8s-watch-hook';
import { ExternalLink } from '@console/internal/components/utils/link';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { Link } from 'react-router-dom';
import { referenceForModel } from '@console/internal/module/k8s';
import { ImageManifestVuln, WatchImageVuln } from '../types';
import { vulnPriority, priorityFor } from '../const';
import { ImageManifestVulnModel } from '../models';

export const securityHealthHandler: ResourceHealthHandler<WatchImageVuln> = ({
  imageManifestVuln,
}) => {
  const { data, loaded, loadError } = imageManifestVuln;

  if (loadError) {
    return { state: HealthState.UNKNOWN, message: 'Not available' };
  }
  if (!loaded) {
    return { state: HealthState.LOADING, message: 'Scanning in progress' };
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
}) => {
  const resource = imageManifestVuln.data;

  const vulnsFor = (severity: string) =>
    resource.filter((v) => v.status?.highestSeverity === severity);
  const fixableVulns = resource
    .filter((v) => v.status?.fixableCount > 0)
    .reduce((all, v) => all.set(v.metadata.name, v), new Map<string, ImageManifestVuln>());

  return (
    <>
      <div className="co-status-popup__description">
        Container images from Quay are analyzed to identify vulnerabilities. Images from other
        registries are not scanned.
      </div>
      {!_.isEmpty(resource) ? (
        <>
          <div className="co-status-popup__section">
            <div className="co-status-popup__row">
              <div className="co-status-popup__text--bold">Vulnerable Container Images</div>
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
                <Link
                  to={`/k8s/all-namespaces/${referenceForModel(ImageManifestVulnModel)}`}
                  aria-label="View all"
                >
                  <ChartDonut
                    colorScale={vulnPriority.map((priority) => priority.color.value).toArray()}
                    data={vulnPriority
                      .map((priority) => ({
                        label: priority.title,
                        x: priority.value,
                        y: _.uniqBy(vulnsFor(priority.value), 'metadata.name').length,
                      }))
                      .toArray()}
                    title={`${_.uniqBy(resource, 'metadata.name').length} total`}
                  />
                </Link>
              </div>
            </div>
          </div>
          {!_.isEmpty(fixableVulns) && (
            <div className="co-status-popup__section">
              <div className="co-status-popup__row">
                <div>
                  <span className="co-status-popup__text--bold">Fixable Container Images</span>
                  <span className="text-secondary">&nbsp;({fixableVulns.size} total)</span>
                </div>
              </div>
              <div className="co-status-popup__row">
                <span className="co-status-popup__text--bold">Impact</span>
                <span className="co-status-popup__text--bold">Vulnerabilities</span>
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
                      to={`/k8s/all-namespaces/${referenceForModel(ImageManifestVulnModel)}?name=${
                        v.metadata.name
                      }`}
                    >
                      {pluralize(
                        resource.filter(({ metadata }) => metadata.name === v.metadata.name).length,
                        'namespace',
                      )}
                    </Link>
                  </span>
                  <div className="text-secondary">
                    <ExternalLink href={quayURLFor(v)} text={`${v.status?.fixableCount} fixable`} />
                  </div>
                </div>
              ))}
              <div className="co-status-popup__row">
                <Link
                  to={{
                    pathname: `/k8s/all-namespaces/${referenceForModel(ImageManifestVulnModel)}`,
                    search: '?orderBy=desc&sortBy=Fixable',
                  }}
                >
                  View all
                </Link>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="co-status-popup__section">
          <span className="text-secondary">No vulnerabilities detected.</span>
        </div>
      )}
    </>
  );
};

export type SecurityBreakdownPopupProps = WatchK8sResults<WatchImageVuln>;

SecurityBreakdownPopup.displayName = 'SecurityBreakdownPopup';
