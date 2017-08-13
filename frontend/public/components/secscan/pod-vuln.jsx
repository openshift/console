import React from 'react';
import { Link } from 'react-router';

import { ContainerRow } from '../pod';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from '../factory';
import { MsgBox, navFactory, Overflow, ResourceIcon, ResourceLink, ResourceSummary, Timestamp } from '../utils';
import { isScanned, isSupported, imagesScanned, hasAccess, makePodvuln, CountVulnerabilityFilter, severityBreakdownInfo } from '../../module/k8s/podvulns';

import { DonutChart } from './donut-chart/donut-chart';

const severityMap = {
  'P0': 'High',
  'P1': 'Medium',
  'P2': 'Low',
  'P3': 'Negligible'
};

const SecurityScanCell = ({podvuln}) => {
  const fixables = _.get(podvuln, 'metadata.labels.secscan/fixables');
  const highest = _.get(podvuln, 'metadata.labels.secscan/highest');
  const numHighest = _.get(podvuln, `metadata.labels.secscan/${highest}`);

  const P0 = _.has(podvuln, 'metadata.labels.secscan/P0') ? parseInt(_.get(podvuln, 'metadata.labels.secscan/P0'), 10) : 0;
  const P1 = _.has(podvuln, 'metadata.labels.secscan/P1') ? parseInt(_.get(podvuln, 'metadata.labels.secscan/P1'), 10) : 0;
  const P2 = _.has(podvuln, 'metadata.labels.secscan/P2') ? parseInt(_.get(podvuln, 'metadata.labels.secscan/P2'), 10) : 0;
  const P3 = _.has(podvuln, 'metadata.labels.secscan/P3') ? parseInt(_.get(podvuln, 'metadata.labels.secscan/P3'), 10) : 0;
  const count = P0 + P1 + P2 + P3;
  
  return <div className="secscan-col">
    <DonutChart width={22} data={severityBreakdownInfo(podvuln)} />
    <span className="secscan-cell">
      {
        !isScanned(podvuln) ? <span className="text-muted">(Not scanned)</span> :
          !hasAccess(podvuln) ? <span className="text-muted">(Unable to scan)</span> :
            !isSupported(podvuln) ? <span className="text-muted">(Unsupported)</span> :
              fixables ? <span><span className={highest}>{numHighest} {severityMap[highest]}</span> / <span>{fixables} fixables</span></span> :
                count === 0 ? <span>Passed</span> : <span>{count.toString()} vulnerable packages</span>
      }
    </span>
  </div>;
};

const PodVulnHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortField="metadata.name">Pod Name</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortField="metadata.labels.secscan/highest">Highest</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs" sortField="metadata.labels.secscan/fixables">Security Scan</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6">Images Scanned</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs" sortField="metadata.annotations.secscan/lastScan">Last Update</ColHead>
</ListHeader>;

const PodVulnRow = ({obj: pod}) => {
  const podvuln = makePodvuln(pod);

  return <ResourceRow>
    <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
      <span className="secscan-cell">
        <ResourceLink kind="PodVuln" name={_.get(pod, 'metadata.name')}
          displayName={_.get(pod, 'metadata.name')}
          namespace={_.get(pod, 'metadata.namespace')} title={_.get(pod, 'metadata.uid')} />
      </span>
    </div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
      <span className="secscan-cell">
        {_.get(pod, 'metadata.labels.secscan/highest', '-')}
      </span>
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <SecurityScanCell podvuln={podvuln} />
    </div>
    <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
      <span className="secscan-cell">
        {imagesScanned(podvuln)}
      </span>
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <span className="secscan-cell">
        <Timestamp timestamp={isScanned(podvuln)} />
      </span>
    </div>
  </ResourceRow>;
};

const PodLink = ({pod, text}) => {
  const podname = _.get(pod, 'metadata.name');
  return <div>
    {text ? (`${text}: `) : ''}
    <Link to={`ns/${pod.metadata.namespace}/pods/${podname}/details`}>
      {podname}
    </Link>
  </div>;
};

const SubHeaderRow = ({header, href, link}) => <div className="col-md-6 subheader-row">{header} <a href={href}>{link}</a></div>;

const VulnLink = ({vuln}) => {
  return <span className="co-resource-link">
    <a href={vuln.Link} target="_blank">{vuln.Name}</a>
  </span>;
};

const ContainerLink = ({podvuln, name}) => {
  const podname = _.get(podvuln, 'metadata.name');

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
      <div className="col-sm-1 hidden-xs">{vuln.Severity}</div>
      <div className="col-md-1 col-sm-2 hidden-xs">{feature.Name}</div>
      <div className="col-md-2 col-sm-2 hidden-xs">{feature.Version}</div>
      <div className="col-md-2 col-sm-2 hidden-xs">{vuln.FixedBy}</div>
      <Overflow className="col-sm-2 col-xs-8" value={imgvuln.Image} />
      <div className="col-md-2 hidden-sm hidden-xs">
        <ContainerLink podvuln={podvuln} name={imgvuln.Container} />
      </div>
    </div>
  </div>;
};

const Details = (pod) => {
  const podvuln = makePodvuln(pod);
  if (_.isError(podvuln)) {
    return <MsgBox className="co-sysevent-stream__status-box-empty" title="No images scanned" detail={<PodLink pod={pod} text="No images was scanned in this pod" />} />;
  }

  if (!hasAccess(podvuln)) {
    return <MsgBox className="co-sysevent-stream__status-box-empty" title="Could read images from registry API" detail={<PodLink pod={pod} text="The labeller could not get image information from registry" />} />;
  }
  
  if (!isSupported(podvuln)) {
    return <MsgBox className="co-sysevent-stream__status-box-empty" title="Images not supported" detail={<PodLink pod={pod} text="The images in this pod could not be scanned" />} />;
  }
  
  return <div>
    <div className="co-m-pane__body">
      <div className="co-m-pane__body-section--bordered">
        <h1 className="co-section-title">Pod Vulnerability Overview</h1>
        <div className="row no-gutter">
          <div className="col-sm-8 col-xs-12">
            <div className="row">
              <div className="col-sm-6 col-xs-12">
                <ResourceSummary resource={pod} showPodSelector={false} showNodeSelector={false} />
              </div>
              <div className="col-sm-6 col-xs-12">
                <dl>
                  <dt>Pod</dt>
                  <dd><PodLink pod={pod} /></dd>
                  <dt>Fixables</dt>
                  <dd>{_.get(pod, 'metadata.labels.secscan/fixables')}</dd>
                  <dt>Highest</dt>
                  <dd>{_.get(pod, 'metadata.labels.secscan/highest')}</dd>
                  <dt>Last Update</dt>
                  <dd><Timestamp timestamp={_.get(pod, 'metadata.annotations.secscan/lastScan')} /></dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="co-m-pane__body">
      <div className="co-m-pane__body-section--bordered">
        <h1 className="co-section-title">Containers</h1>
        <div className="row no-gutter">
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <div className="row co-m-table-grid__head">
              <div className="col-sm-2 col-xs-4">Name</div>
              <div className="col-sm-2 hidden-xs">Id</div>
              <div className="col-sm-2 col-xs-8">Image</div>
              <div className="col-md-2 col-sm-2 hidden-xs">Security Scan</div>
              <div className="col-md-1 col-sm-2 hidden-xs">State</div>
              <div className="col-md-1 col-sm-2 hidden-xs">Restart Count</div>
              <div className="col-md-2 hidden-sm hidden-xs">Started At</div>
            </div>
            <div className="co-m-table-grid__body">
              {pod.spec.containers.map((c, i) => <ContainerRow key={i} pod={pod} container={c} />)}
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
              {
                podvuln.imagevulns.map((imgvuln) =>
                  imgvuln.Features.map((feature) => {
                    if (_.has(feature, 'Vulnerabilities')) {
                      feature.Vulnerabilities.map((vuln, i) =>
                        <ContainerVulnRow key={i} podvuln={podvuln} imgvuln={imgvuln} feature={feature} vuln={vuln} />
                      );
                    }
                  })
                )
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
};

export const PodVulnsDetailsPage = props => <DetailsPage
  {...props}
  kind="Pod"
  pages={[
    navFactory.details(Details)
  ]}
/>;

export const PodVulnList = props => <List {...props} Header={PodVulnHeader} Row={PodVulnRow} />;

export const PodVulnsPage = props => <ListPage
  {...props}
  canCreate={false}
  kind="Pod"
  ListComponent={PodVulnList}
  title="Security Scan Report"
  filterLabel="vulnerabilities by name"
  Intro={
    <SubHeaderRow
      header="All supported container images are scanned for known vulnerabilities and CVEs." 
      href="https://quay.io"
      link="Learn more about Tectonic Security Scanning."
    />
  }
  rowFilters={[{
    type: 'podvuln-filter',
    selected: ['P0', 'P1', 'P2', 'P3'],
    numbers: CountVulnerabilityFilter,
    items: [
      {id: 'P0', title: 'Priority/P0'},
      {id: 'P1', title: 'Priority/P1'},
      {id: 'P2', title: 'Priority/P2'},
      {id: 'P3', title: 'Priority/P3'},
      {id: 'Passed', title: 'No Vulnerabilities'},
      {id: 'Fixables', title: 'Fixables'},
      {id: 'NotScanned', title: 'Not Scanned'},
    ],
  },
  ]}
/>;
