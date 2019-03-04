import * as React from 'react';
import * as classNames from 'classnames';
import { Row, Col } from 'patternfly-react';
import { getResource } from 'kubevirt-web-ui-components';

import { BaremetalHostModel } from '../../models/host';
import { navFactory } from '../utils/okdutils';
import { WithResources } from '../../../kubevirt/components/utils/withResources';
import { DetailsPage } from '../factory/okdfactory';


const BaremetalHostDetails = props => {
  const { metadata, spec, status } = props.bmh;
  const { name } = metadata;
  const { online } = spec;
  const { hardware } = status;
  const ips = hardware.nics.map(nic => nic.ip).join(', ');

  const statusClasses = classNames({
    fa: true,
    'co-icon-and-text__icon': online === true,
    'fa-refresh': true,
  });

  return (
    <div className="co-m-pane__body">
      <h1 className="co-m-pane__heading">
        Baremetal Host Overview
      </h1>
      <Row>
        <Col lg={4} md={4} sm={4} xs={4} id="name-description-column">
          <dl>
            <dt>Name</dt>
            <dd>{name}</dd>
            <dt>Status</dt>
            <dd>
              <span className="co-icon-and-text">
                <span aria-hidden="true" className={statusClasses} />
                {online ? 'Running' : 'Not running'}
              </span>
            </dd>
            <dt>IP Addresses</dt>
            <dd>{ips}</dd>
          </dl>
        </Col>
      </Row>
    </div>
  );
};

const ConnectedBmDetails = ({ obj: bmh }) => {
  const { name, namespace } = bmh.metadata;
  const resourceMap = {
    bmh: {
      resource: getResource(BaremetalHostModel, {name, namespace, isList: false}),
      ignoreErrors: true,
    },
  };

  return (
    <WithResources resourceMap={resourceMap}>
      <BaremetalHostDetails bmh={bmh} />
    </WithResources>
  );
};


export const BaremetalHostsDetailPage = props => {
  const { name, namespace } = props;
  const pages = [
    navFactory.details(ConnectedBmDetails),
  ];
  return (
    <DetailsPage
      {...props}
      pages={pages}
      resources={[
        getResource(BaremetalHostModel, {name, namespace, isList: false}),
      ]}
    />
  );
};
