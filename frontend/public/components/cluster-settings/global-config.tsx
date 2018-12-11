/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { K8sKind, k8sList, referenceForModel } from '../../module/k8s';
import { ResourceLink, resourcePathFromModel } from '../utils/resource-link';

const globalConfigListStateToProps = ({k8s}) => ({
  configResources: k8s.getIn(['RESOURCES', 'configResources']),
});

const ItemRow = ({item}) => {
  return <div className="row co-resource-list__item">
    <div className="col-sm-5 col-xs-6">
      <ResourceLink kind={referenceForModel(item.model)} name={item.metadata.name} />
    </div>
    <div className="col-sm-5 col-xs-6">
      {item.kind}
    </div>
    <div className="col-sm-2 hidden-xs">
      <Link to={`${resourcePathFromModel(item.model, item.metadata.name)}/yaml`} className="btn btn-default pull-right">Edit YAML</Link>
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
      return k8sList(model)
        .catch(err => {
          errorMessage += `${err.message} `;
          this.setState({ errorMessage });
          return [];
        }).then(items => items.map(i => ({...i, model})));
    })).then((responses) => {
      const items = _.orderBy(_.flatten(responses), ['metadata.name', 'kind'], ['asc', 'asc']);
      this.setState({items});
    });
  }

  render() {
    const { errorMessage, items } = this.state;

    return <div className="co-m-pane__body">
      {errorMessage && <div className="alert alert-danger"><span className="pficon pficon-error-circle-o" aria-hidden="true" />{errorMessage}</div>}
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-sm-5 col-xs-6">Name</div>
          <div className="col-sm-5 col-xs-6">Kind</div>
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
