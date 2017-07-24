import React from 'react';
import { Link } from 'react-router';

import { ContainerRow } from '../pod';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from '../factory';
import { MsgBox, navFactory, Overflow, ResourceIcon, ResourceLink, ResourceSummary, Timestamp } from '../utils';
import { isScanned, isSupported, imagesScanned, hasAccess, makePodvuln, CountVulnerabilityFilter } from '../../module/k8s/podvulns';

const PodVulnHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortField="metadata.name">Pod Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6">Images Scanned</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs">Security Scan</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs">Highest</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs">Last Update</ColHead>
</ListHeader>;

const PodVulnRow = ({obj: pod}) => {
  const podvuln = makePodvuln(pod);
  
  const fixables = _.get(pod, 'metadata.labels.secscan/fixables');
  const P0 = _.has(pod, 'metadata.labels.secscan/P0') ? parseInt(_.get(pod, 'metadata.labels.secscan/P0'), 10) : 0;
  const P1 = _.has(pod, 'metadata.labels.secscan/P1') ? parseInt(_.get(pod, 'metadata.labels.secscan/P1'), 10) : 0;
  const P2 = _.has(pod, 'metadata.labels.secscan/P2') ? parseInt(_.get(pod, 'metadata.labels.secscan/P2'), 10) : 0;
  const P3 = _.has(pod, 'metadata.labels.secscan/P3') ? parseInt(_.get(pod, 'metadata.labels.secscan/P3'), 10) : 0;
  const count = P0 + P1 + P2 + P3;

  return <ResourceRow>
    <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
      <ResourceLink kind="PodVuln" name={_.get(pod, 'metadata.name')}
        displayName={_.get(pod, 'metadata.name')}
        namespace={_.get(pod, 'metadata.namespace')} title={_.get(pod, 'metadata.uid')} />
    </div>
    <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
      {imagesScanned(podvuln)}
    </div>

    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
        {
          !isScanned(podvuln) ? <div className="text-muted">(Not scanned)</div> :
          !hasAccess(podvuln) ? <div className="text-muted">(Unable to scan)</div> :
          !isSupported(podvuln) ? <div className="text-muted">(Unsupported)</div> :
          (fixables ? `${fixables} fixable packages` : `${count.toString()} vulnerable packages`)
        }
    </div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
      {_.get(pod, 'metadata.labels.secscan/highest', '-')}
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <Timestamp timestamp={isScanned(podvuln)} />
    </div>
  </ResourceRow>;
};

const PodLink = ({pod}) => {
  const podname = _.get(pod, 'metadata.name');
  return <Link to={`ns/${pod.metadata.namespace}/pods/${podname}/details`}>{podname}</Link>;
};

const SubHeaderRow = ({header, href, link}) => <div className="col-md-6">{header} <a href={href}>{link}</a></div>;

const VulnLink = ({vuln}) => {
  return <span className="co-resource-link">
    <a href={vuln.link} target="_blank">{vuln.name}</a>
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

const Details = (pod) => {
  const podvuln = makePodvuln(pod);
  if (_.isError(podvuln)) {
    return <MsgBox className="co-sysevent-stream__status-box-empty" title="No images scanned" detail="No images was scanned in this pod" />;
  }

  if (!hasAccess(podvuln)) {
    return <MsgBox className="co-sysevent-stream__status-box-empty" title="Could read images from registry API" detail="The labeller could not get image information from registry" />;
  }
  
  if (!isSupported(podvuln)) {
    return <MsgBox className="co-sysevent-stream__status-box-empty" title="Images not supported" detail="The images in this pod could not be scanned" />;
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
                  imgvuln.features.map((feature) =>
                    feature.vulnerabilities.map((vuln, i) =>
                      <ContainerVulnRow key={i} podvuln={podvuln} imgvuln={imgvuln} feature={feature} vuln={vuln} />
                    )
                  )
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

export const PodVulnsPage = props => {
  return <ListPage
  {...props}
  canCreate={false}
  kind="Pod"
  ListComponent={PodVulnList}
  title="Security Scan Report"
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
      {id: 'P0', title: 'P0'},
      {id: 'P1', title: 'P1'},
      {id: 'P2', title: 'P2'},
      {id: 'P3', title: 'P3'},
      {id: 'Passed', title: 'No Vulnerabilities'},
      {id: 'Fixables', title: 'Fixables'},
      {id: 'NotScanned', title: 'Not Scanned'},
    ],
  },
  ]}
/>;};
