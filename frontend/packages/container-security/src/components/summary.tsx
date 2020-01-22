import * as React from 'react';
import * as _ from 'lodash';
import { ChartDonut } from '@patternfly/react-charts';
import { SecurityIcon } from '@patternfly/react-icons';
import { URLHealthHandler } from '@console/plugin-sdk';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { FirehoseResult } from '@console/internal/components/utils/types';
import { Link } from 'react-router-dom';
import { referenceForModel } from '@console/internal/module/k8s';
import { ImageManifestVuln } from '../types';
import { vulnPriority } from '../const';
import { ImageManifestVulnModel } from '../models';

export const securityHealthHandler: URLHealthHandler<string> = (
  k8sHealth,
  error,
  resource: FirehoseResult<ImageManifestVuln[]>,
) => {
  if (error || _.get(resource, 'loadError')) {
    return { state: HealthState.UNKNOWN, message: 'Not available' };
  }
  if (!_.get(resource, 'loaded')) {
    return { state: HealthState.LOADING, message: 'Scanning in progress' };
  }
  if (!_.isEmpty(resource.data)) {
    return { state: HealthState.ERROR, message: `${resource.data.length} vulnerabilities` };
  }
  return { state: HealthState.OK, message: '0 vulnerabilities' };
};

export const quayURLFor = (vuln: ImageManifestVuln) => {
  const base = vuln.spec.image
    .split('/')
    .reduce((url, part, i) => [...url, part, ...(i === 0 ? ['repository'] : [])], [])
    .join('/');
  return `//${base}/manifest/${vuln.spec.manifest}?tab=vulnerabilities`;
};

export const SecurityBreakdownPopup: React.FC<SecurityBreakdownPopupProps> = (props) => {
  const vulnsFor = (severity: string) =>
    props.k8sResult.data.filter((v) => _.get(v.status, 'highestSeverity') === severity);
  const fixableVulns = props.k8sResult.data
    .filter((v) => _.get(v.status, 'fixableCount', 0) > 0)
    .reduce((all, v) => all.set(v.metadata.name, v), new Map<string, ImageManifestVuln>());

  return (
    <>
      <div className="co-overview-status__control-plane-description">
        Container images from Quay are analyzed to identify vulnerabilities. Images from other
        registries are not scanned.
      </div>
      {!_.isEmpty(props.k8sResult.data) ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: '66%', marginRight: '24px' }}>
              <div className="co-overview-status__row">
                <div className="co-overview-status__text--bold">Severity</div>
                <div className="text-secondary">Fixable</div>
              </div>
              {vulnPriority
                .map((priority) =>
                  !_.isEmpty(vulnsFor(priority.value)) ? (
                    <div className="co-overview-status__row" key={priority.value}>
                      <div className="co-overview-status__text--bold">
                        {vulnsFor(priority.value).length} {priority.title}
                      </div>
                      <div className="text-secondary">
                        {
                          props.k8sResult.data.filter(
                            (v) =>
                              _.get(v.status, 'highestSeverity') === priority.value &&
                              _.get(v.status, 'fixableCount', 0) > 0,
                          ).length
                        }{' '}
                        <SecurityIcon color={priority.color.value} />
                      </div>
                    </div>
                  ) : null,
                )
                .toArray()}
            </div>
            <div>
              <ChartDonut
                colorScale={vulnPriority.map((priority) => priority.color.value).toArray()}
                data={vulnPriority
                  .map((priority) => ({
                    label: priority.title,
                    x: priority.value,
                    y: vulnsFor(priority.value).length,
                  }))
                  .toArray()}
                title={`${props.k8sResult.data.length} total`}
              />
            </div>
          </div>
          {!_.isEmpty(fixableVulns) && (
            <>
              <div className="co-overview-status__row">
                <div className="co-overview-status__text--bold">Fixable Vulnerabilities</div>
              </div>
              {_.take([...fixableVulns.values()], 5).map((v) => (
                <div className="co-overview-status__row" key={v.metadata.name}>
                  <span>
                    <SecurityIcon
                      color={
                        vulnPriority.find((p) => p.title === _.get(v.status, 'highestSeverity'))
                          .color.value
                      }
                    />{' '}
                    <a href={quayURLFor(v)}>{v.spec.features[0].name}</a>
                  </span>
                  <div className="text-secondary">
                    <Link
                      to={`/k8s/all-namespaces/${referenceForModel(ImageManifestVulnModel)}?name=${
                        v.metadata.name
                      }`}
                    >
                      {
                        props.k8sResult.data.filter(
                          ({ metadata }) => metadata.name === v.metadata.name,
                        ).length
                      }{' '}
                      namespaces
                    </Link>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <div>No vulnerabilities detected.</div>
      )}
    </>
  );
};

export type SecurityBreakdownPopupProps = {
  healthResult?: any;
  healthResultError?: any;
  k8sResult?: FirehoseResult<ImageManifestVuln[]>;
};

SecurityBreakdownPopup.displayName = 'SecurityBreakdownPopup';
