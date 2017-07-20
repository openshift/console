import React from 'react';
import { Link } from 'react-router';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from '../factory';
import { Cog, navFactory, Overflow, ResourceIcon, ResourceLink, ResourceSummary, Timestamp } from '../utils';

const podvulnNameToPodName = function(name) {
  return name.replace(/^podvuln-/, '');
};

const menuActions = Cog.factory.common;

const CountVulnerabilityFilter = (podvulns) => {
  if (!podvulns) {
    return undefined;
  }
  let count = {
    'P0': 0,
    'P1': 0,
    'P2': 0,
    'P3': 0,
    'Fixables': 0,
    'Passed': 0,
  };
  _.forEach(podvulns, (podvuln) => {
    if (_.has(podvuln, 'metadata.labels.secscan/P0')) {
      count.P0++;
    }
    if (_.has(podvuln, 'metadata.labels.secscan/P1')) {
      count.P1++;
    }
    if (_.has(podvuln, 'metadata.labels.secscan/P2')) {
      count.P2++;
    }
    if (_.has(podvuln, 'metadata.labels.secscan/P3')) {
      count.P3++;
    }
    if (_.has(podvuln, 'metadata.labels.secscan/fixables')) {
      count.Fixables++;
    }
    if (!_.has(podvuln, 'metadata.labels.secscan/P0') &&
	!_.has(podvuln, 'metadata.labels.secscan/P1') &&
	!_.has(podvuln, 'metadata.labels.secscan/P2') &&
	!_.has(podvuln, 'metadata.labels.secscan/P3')) {
      count.Passed++;
    }
  });
  return count;
};

const PodVulnHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortField="metadata.name">Pod Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6">Images Scanned</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs">Security Scan</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs">Highest</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs">Last Update</ColHead>
</ListHeader>;

const PodVulnRow = ({obj: podvuln}) => {
  const scannable = _.get(podvuln, 'metadata.annotations.secscan/lastScan');
  const fixables = _.get(podvuln, 'metadata.labels.secscan/fixables');
  const P0 = _.has(podvuln, 'metadata.labels.secscan/P0') ? parseInt(_.get(podvuln, 'metadata.labels.secscan/P0'), 10) : 0;
  const P1 = _.has(podvuln, 'metadata.labels.secscan/P1') ? parseInt(_.get(podvuln, 'metadata.labels.secscan/P1'), 10) : 0;
  const P2 = _.has(podvuln, 'metadata.labels.secscan/P2') ? parseInt(_.get(podvuln, 'metadata.labels.secscan/P2'), 10) : 0;
  const P3 = _.has(podvuln, 'metadata.labels.secscan/P3') ? parseInt(_.get(podvuln, 'metadata.labels.secscan/P3'), 10) : 0;
  const count = P0 + P1 + P2 + P3;
  const length = scannable ? (podvuln.imagevulns ? podvuln.imagevulns.length : 0) : 0;
  
  return <ResourceRow>
    <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
      <ResourceLink kind="PodVuln" name={podvuln.metadata.name}
	displayName={podvuln.metadata.name.replace(/^podvuln-/, '')}
	namespace={podvuln.metadata.namespace} title={podvuln.metadata.uid} />
    </div>
    <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
      {length}
    </div>

    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      {
	(!length && scannable) ? <div className="text-muted">(Unsupported)</div> :
	scannable ? (fixables ? `${fixables} fixable packages` : `${count.toString()} vulnerable packages`) :
	'Unable to scan pod'
      }
    </div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
      {podvuln.metadata.labels['secscan/highest'] ? podvuln.metadata.labels['secscan/highest'] : '-'}
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      {/* {scannable ? scannable : '-'} */}
      <Timestamp timestamp={scannable} />
    </div>
  </ResourceRow>;
};

const PodLink = ({podvuln}) => {
  const podname = podvulnNameToPodName(podvuln.metadata.name);
  return podvuln ? <Link to={`ns/${podvuln.metadata.namespace}/pods/${podname}/details`}>{podname}</Link> : <span></span>;
};

const SubHeaderRow = ({header}) => {
  return <div className="col-md-6">{header}</div>;
};

const VulnLink = ({vuln}) => {
  return <span className="co-resource-link">
    <a href={vuln.link} target="_blank">{vuln.name}</a>
  </span>;
};

const ContainerLink = ({podvuln, name}) => {
  const podname = podvulnNameToPodName(podvuln.metadata.name);

  return <span className="co-resource-link">
    <ResourceIcon kind="Container" />
    <Link to={`ns/${podvuln.metadata.namespace}/pods/${podname}/containers/${name}/details`}>{name}</Link>
  </span>;
};

const ContainerVulnRow = ({podvuln, imgvuln, feature, vuln}) => {
  return <div className="row">
    <div className="middler">
      <div className="col-sm-2 col-xs-4">
        <VulnLink vuln={vuln} />
      </div>
      <div className="col-sm-1 hidden-xs">{vuln.severity}</div>
      <div className="col-md-1 col-sm-2 hidden-xs">{feature.name}</div>
      <div className="col-md-2 col-sm-2 hidden-xs">{feature.version}</div>
      <div className="col-md-2 col-sm-2 hidden-xs">{vuln.fixedby}</div>
      <Overflow className="col-sm-2 col-xs-8" value={imgvuln.image} />
      <div className="col-md-2 hidden-sm hidden-xs">
        <ContainerLink podvuln={podvuln} name={imgvuln.container} />
      </div>
    </div>
  </div>;
};

const Details = (podvuln) => {
  return <div>
    <div className="co-m-pane__body">
      <div className="co-m-pane__body-section--bordered">
        <h1 className="co-section-title">Pod Vulnerability Overview</h1>
        <div className="row no-gutter">
          <div className="col-sm-8 col-xs-12">
            <div className="row">
              <div className="col-sm-6 col-xs-12">
                <ResourceSummary resource={podvuln} showPodSelector={false} showNodeSelector={false} />
              </div>
              <div className="col-sm-6 col-xs-12">
                <dl>
                  <dt>Pod</dt>
                  <dd><PodLink podvuln={podvuln} /></dd>
                  <dt>Fixables</dt>
                  <dd>{podvuln.metadata.labels['secscan/fixables']}</dd>
                  <dt>Highest</dt>
                  <dd>{podvuln.metadata.labels['secscan/highest']}</dd>
                  <dt>Last Update</dt>
                  <dd><Timestamp timestamp={_.get(podvuln, 'metadata.annotations.secscan/lastScan')} /></dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="co-m-pane__body">
      <div className="co-m-pane__body-section--bordered">
        <h1 className="co-section-title">Container Vulnerabilities</h1>
        <div className="row no-gutter">
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <div className="row co-m-table-grid__head">
              <div className="col-sm-2 col-xs-4">CVE</div>
              <div className="col-sm-1 hidden-xs">Severity</div>
              <div className="col-md-1 col-sm-2 hidden-xs">Package</div>
              <div className="col-md-2 col-sm-2 hidden-xs">Current Version</div>
              <div className="col-md-2 col-sm-2 hidden-xs">Fixed In Version</div>
              <div className="col-sm-2 col-xs-8">Image</div>
              <div className="col-md-2 hidden-sm hidden-xs">Container</div>
            </div>
            <div className="co-m-table-grid__body">
              {podvuln.imagevulns.map((imgvuln) =>
                imgvuln.features.map((feature) =>
                  feature.vulnerabilities.map((vuln, i) =>
                    <ContainerVulnRow key={i} podvuln={podvuln} imgvuln={imgvuln} feature={feature} vuln={vuln} />
                  )
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
};

export const PodVulnsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[
    navFactory.details(Details)
  ]}
/>;

export const PodVulnList = props => <List {...props} Header={PodVulnHeader} Row={PodVulnRow} />;

export const PodVulnsPage = props => {
  return <ListPage
  {...props}
  canCreate={false}
  kind="PodVuln"
  ListComponent={PodVulnList}
  title="Security Scan Report"
  Intro={<SubHeaderRow header="All supported container images are scanned for known vulnerabilities and CVEs." />}
  rowFilters={[{
    type: 'podvuln-filter',
    selected: ['P0', 'P1', 'P2', 'P3'],
    numbers: CountVulnerabilityFilter,
    items: [
      {id: 'P0', title: 'P0'},
      {id: 'P1', title: 'P1'},
      {id: 'P2', title: 'P2'},
      {id: 'P3', title: 'P3'},
      {id: 'Passed', title: 'No Vulnerabilities'},
      {id: 'Fixables', title: 'Fixables'},
    ],
  },
  ]}
/>;};
