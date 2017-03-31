import React from 'react';

import {DetailsPage, ListPage, makeList} from './factory';
import {Cog, Heading, LabelList, ResourceCog, ResourceIcon, detailsPage, EmptyBox, navFactory, ResourceLink, ResourceSummary} from './utils';

const menuActions = Cog.factory.common;

const getHosts = (ingress) => {
  const hosts = _.map(_.get(ingress, 'spec.rules'), 'host');

  const validHosts = _.filter(hosts, _.isString);

  if (validHosts.length) {
    return <div className="co-m-label-list">{hosts.join(', ')}</div>;
  }

  return <div className="text-muted">No hosts</div>;
};

const getTLSCert = (ingress) => {
  if (!_.has(ingress.spec, 'tls')) {
    return <div><span>Not configured</span></div>;
  }

  const certs = _.map(ingress.spec.tls, 'secretName');

  return <div>
    <ResourceIcon kind="secret" className="co-m-resource-icon--align-left" />
    <span>{certs.join(', ')}</span>
  </div>;
};

const IngressListHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-3">Ingress Name</div>
  <div className="col-xs-4">Ingress Labels</div>
  <div className="col-xs-5">Hosts</div>
</div>;

const IngressListRow = ({obj: ingress}) => <div className="row co-resource-list__item">
  <div className="col-xs-3">
    <ResourceCog actions={menuActions} kind="ingress" resource={ingress} />
    <ResourceLink kind="ingress" name={ingress.metadata.name}
      namespace={ingress.metadata.namespace} title={ingress.metadata.uid} />
  </div>
  <div className="col-xs-4">
    <LabelList kind="ingress" labels={ingress.metadata.labels} />
  </div>
  <div className="col-xs-5">{getHosts(ingress)}</div>
</div>;

const RulesHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-3">Host</div>
  <div className="col-xs-3">Path</div>
  <div className="col-xs-3">Service</div>
  <div className="col-xs-2">Service Port</div>
</div>;

const RulesRow = ({rule}) => {

  return <div className="row co-resource-list__item">
    <div className="col-xs-3">
      <div>{rule.host}</div>
    </div>
    <div className="col-xs-3">
      <div>{rule.path}</div>
    </div>
    <div className="col-xs-3">
      <div><ResourceIcon kind="service" className="co-m-resource-icon--align-left" />{rule.serviceName}</div>
    </div>
     <div className="col-xs-2">
      <div>{rule.servicePort}</div>
    </div>
  </div>;
};

const RulesRows = (props) => {
  const rules = [];

  if (_.has(props.spec, 'rules')) {
    _.forEach(props.spec.rules, rule => {
      _.forEach(rule.http.paths, path => {
        rules.push({
          host: rule.host || '',
          path: path.path || '',
          serviceName: path.backend.serviceName,
          servicePort: path.backend.servicePort,
        });
      });
    });

    const rows = _.map(rules, rule => {
      return <RulesRow rule={rule} key={rule.serviceName} />;
    });

    return <div className="co-m-table-grid__body"> {rows} </div>;
  }

  return <EmptyBox label="Rule" />;
};

const Details = (ingress) => <div className="col-md-12">
  <div className="co-m-pane">
    <div className="co-m-pane__body">
      <ResourceSummary resource={ingress} showPodSelector={false} showNodeSelector={false}>
        <dt>Tls Certificate</dt>
        <dd>{getTLSCert(ingress)}</dd>
      </ResourceSummary>
    </div>

    <Heading text="Ingress Rules" />
    <div className="co-m-pane__body">
      <div className="row co-m-form-row">
        <div className="col-md-12">
          These rules are handled by a routing layer (Ingress Controller) which is updated as the rules are modified. The Ingress controller implementation defines how headers and other metadata are forwarded or manipulated.
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <div className="co-m-deployment-list co-m-table-grid co-m-table-grid--bordered">
            <RulesHeader />
            <RulesRows spec={ingress.spec} />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>;

const pages = [navFactory.details(detailsPage(Details)), navFactory.editYaml()];
const IngressDetailsPage = props => <DetailsPage pages={pages} menuActions={menuActions} {...props} />;
const IngressList = makeList('Ingress', 'ingress', IngressListHeader, IngressListRow);
const IngressPage = props => <ListPage ListComponent={IngressList} {...props} />;

export {IngressList, IngressPage, IngressDetailsPage};
