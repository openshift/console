import React from 'react';
import moment from 'moment';

import {DetailsPage, List, ListPage} from './factory';
import ConfigMapAndSecretData from './configmap-and-secret-data';
import {Cog, Heading, ResourceCog, ResourceLink, ResourceSummary, detailsPage, navFactory} from './utils';
import classnames from 'classnames';

const menuActions = Cog.factory.common;

const SecretHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-4">Secret Name</div>
  <div className="col-xs-4">Secret Data</div>
  <div className="col-xs-4">Secret Age</div>
</div>;

const SecretRow = ({obj: secret}) => {
  const data = Object.keys(secret.data || {}).length;
  const age = moment(secret.metadata.creationTimestamp).fromNow();

  return <div className="row co-resource-list__item">
    <div className="col-xs-4">
      <ResourceCog actions={menuActions} kind="secret" resource={secret} />
      <ResourceLink kind="secret" name={secret.metadata.name} namespace={secret.metadata.namespace} title={secret.metadata.uid} />
    </div>
    <div className="col-xs-4">{data}</div>
    <div className="col-xs-4">{age}</div>
  </div>;
};

const SecretDetails = (secret) => {
  return <div className="col-md-12">
    <div className="co-m-pane">
      <div className="co-m-pane__body">
        <ResourceSummary resource={secret} showPodSelector={false} showNodeSelector={false} />
      </div>

      <div></div>

      <Heading text="Data" />
      <div className="co-m-pane__body">
        <ConfigMapAndSecretData data={secret.data} decode={window.atob} />
      </div>
    </div>
  </div>;
};

const withSecretsList = (Row) => {
  return class WithSecretsList extends React.Component {
    constructor (props) {
      super(props);
      this.state = {open: false};
      this.onClick_ = this.onClick_.bind(this);
    }

    onClick_ (e) {
      e.preventDefault();
      this.setState({open: !this.state.open});
    }

    render () {
      const {obj: {metadata: {namespace}, secrets}} = this.props;
      const filters = {selector: {field: 'metadata.name', values: new Set(_.map(secrets, 'name'))}};

      return (
        <div onClick={this.onClick_} ref="target" className={classnames({clickable: !!secrets})} >
          <Row {...this.props} />
          {
            this.state.open && secrets &&
            <SecretsList namespace={namespace} filters={filters} />
          }
        </div>
      );
    }
  };
};

const pages = [navFactory.details(detailsPage(SecretDetails)), navFactory.editYaml()];

const SecretsList = props => <List {...props} Header={SecretHeader} Row={SecretRow} />;
const SecretsPage = props => <ListPage ListComponent={SecretsList} {...props} />;
const SecretsDetailsPage = props => <DetailsPage pages={pages} menuActions={menuActions} {...props} />;

export {SecretsList, SecretsPage, SecretsDetailsPage, withSecretsList};
