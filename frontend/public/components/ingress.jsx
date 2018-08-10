import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, SectionHeading, LabelList, ResourceCog, ResourceIcon, detailsPage, EmptyBox, navFactory, ResourceLink, ResourceSummary } from './utils';

const menuActions = Cog.factory.common;

export const ingressValidHosts = ingress => _.map(_.get(ingress, 'spec.rules', []), 'host').filter(_.isString);

const getHosts = (ingress) => {
  const hosts = ingressValidHosts(ingress);

  if (hosts.length) {
    return <div>{hosts.join(', ')}</div>;
  }

  return <div className="text-muted">No hosts</div>;
};

const getTLSCert = (ingress) => {
  if (!_.has(ingress.spec, 'tls')) {
    return <div><span>Not configured</span></div>;
  }

  const certs = _.map(ingress.spec.tls, 'secretName');

  return <div>
    <ResourceIcon kind="Secret" className="co-m-resource-icon--align-left" />
    <span>{certs.join(', ')}</span>
  </div>;
};

const IngressListHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm hidden-xs" sortFunc="ingressValidHosts">Hosts</ColHead>
</ListHeader>;

const IngressListRow = ({obj: ingress}) => <ResourceRow obj={ingress}>
  <div className="col-md-3 col-sm-4 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind="Ingress" resource={ingress} />
    <ResourceLink kind="Ingress" name={ingress.metadata.name}
      namespace={ingress.metadata.namespace} title={ingress.metadata.uid} />
  </div>
  <div className="col-md-3 col-sm-4 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={ingress.metadata.namespace} title={ingress.metadata.namespace} />
  </div>
  <div className="col-md-3 col-sm-4 hidden-xs">
    <LabelList kind="Ingress" labels={ingress.metadata.labels} />
  </div>
  <div className="col-md-3 hidden-sm hidden-xs">{getHosts(ingress)}</div>
</ResourceRow>;

const RulesHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-3">Host</div>
  <div className="col-xs-3">Path</div>
  <div className="col-xs-3">Service</div>
  <div className="col-xs-2">Service Port</div>
</div>;

const RulesRow = ({rule, namespace}) => {

  return <div className="row co-resource-list__item">
    <div className="col-xs-3 co-break-word">
      <div>{rule.host}</div>
    </div>
    <div className="col-xs-3 co-break-word">
      <div>{rule.path}</div>
    </div>
    <div className="col-xs-3">
      {rule.serviceName ? <ResourceLink kind="Service" name={rule.serviceName} namespace={namespace} /> : '-'}
    </div>
    <div className="col-xs-2">
      <div>{rule.servicePort || '-'}</div>
    </div>
  </div>;
};

const RulesRows = (props) => {
  const rules = [];

  if (_.has(props.spec, 'rules')) {
    _.forEach(props.spec.rules, rule => {
      const paths = _.get(rule, 'http.paths');
      if (_.isEmpty(paths)) {
        rules.push({
          host: rule.host || '*',
          path: '*',
          serviceName: _.get(props.spec, 'backend.serviceName'),
          servicePort: _.get(props.spec, 'backend.servicePort'),
        });
      } else {
        _.forEach(paths, path => {
          rules.push({
            host: rule.host || '*',
            path: path.path || '*',
            serviceName: path.backend.serviceName,
            servicePort: path.backend.servicePort,
          });
        });
      }
    });

    const rows = _.map(rules, rule => {
      return <RulesRow rule={rule} key={rule.serviceName} namespace={props.namespace} />;
    });

    return <div className="co-m-table-grid__body"> {rows} </div>;
  }

  return <EmptyBox label="Rules" />;
};

const Details = ({obj: ingress}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Ingress Overview" />
    <ResourceSummary resource={ingress} showPodSelector={false} showNodeSelector={false}>
      <dt>TLS Certificate</dt>
      <dd>{getTLSCert(ingress)}</dd>
    </ResourceSummary>
  </div>
  <div className="co-m-pane__body">
    <SectionHeading text="Ingress Rules" />
    <p className="co-m-pane__explanation">These rules are handled by a routing layer (Ingress Controller) which is updated as the rules are modified. The Ingress controller implementation defines how headers and other metadata are forwarded or manipulated.</p>
    <div className="co-m-table-grid co-m-table-grid--bordered">
      <RulesHeader />
      <RulesRows spec={ingress.spec} namespace={ingress.metadata.namespace} />
    </div>
  </div>
</React.Fragment>;

const IngressesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(detailsPage(Details)), navFactory.editYaml()]}
/>;
const IngressesList = props => <List {...props} Header={IngressListHeader} Row={IngressListRow} />;
const IngressesPage = props => <ListPage ListComponent={IngressesList} canCreate={true} {...props} />;

export {IngressesList, IngressesPage, IngressesDetailsPage};
