/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { K8sKind, k8sList } from '../../module/k8s';
import { resourcePathFromModel } from '../utils/resource-link';

const globalConfigListStateToProps = ({k8s}) => ({
  configResources: k8s.getIn(['RESOURCES', 'configResources']),
});

const ItemRow = ({item}) => {
  const resourceLink = resourcePathFromModel(item.model, item.metadata.name, item.metadata.namespace);
  return <div className="row co-resource-list__item">
    <div className="col-sm-10 col-xs-12">
      <Link to={resourceLink}>{item.kind}</Link>
    </div>
    <div className="col-sm-2 hidden-xs">
      <Link to={`${resourceLink}/yaml`} className="btn btn-default pull-right">Edit YAML</Link>
    </div>
  </div>;
};

class GlobalConfigPage_ extends React.Component<GlobalConfigPageProps, GlobalConfigPageState> {
  readonly state: GlobalConfigPageState = {
    errorMessage: '',
    items: [],
  }

  componentDidMount() {
    let errorMessage = '';
    Promise.all(this.props.configResources.map(model => {
      return k8sList(model, { fieldSelector: 'metadata.name=cluster' })
        .catch(err => {
          errorMessage += `${err.message} `;
          this.setState({ errorMessage });
          return [];
        }).then(items => items.map(i => ({...i, model})));
    })).then((responses) => {
      const items = _.sortBy(_.flatten(responses), 'kind', 'asc');
      this.setState({items});
    });
  }

  render() {
    const { errorMessage, items } = this.state;

    return <div className="co-m-pane__body">
      {errorMessage && <div className="alert alert-danger"><span className="pficon pficon-error-circle-o" aria-hidden="true" />{errorMessage}</div>}
      <p className="co-m-pane__explanation">
        Edit the following resources to manage the configuration of your cluster.
      </p>
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-sm-10 col-xs-12">Configuration Resource</div>
          <div className="col-sm-2 hidden-xs"></div>
        </div>
        <div className="co-m-table-grid__body">
          { _.map(items, item => <ItemRow item={item} key={item.metadata.uid} />)}
        </div>
      </div>
    </div>;
  }
}

export const GlobalConfigPage = connect(globalConfigListStateToProps)(GlobalConfigPage_);

type GlobalConfigPageProps = {
  configResources: K8sKind[];
};

type GlobalConfigPageState = {
  errorMessage: string,
  items: any,
};
