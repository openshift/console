import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Alert } from '@patternfly/react-core';

import { connectToExtensions, Extension, isGlobalConfig, GlobalConfig } from '@console/plugin-sdk';
import { RootState } from '../../redux';
import { featureReducerName, flagPending, FeatureState } from '../../reducers/features';
import { K8sKind, k8sList, referenceForModel } from '../../module/k8s';
import { resourcePathFromModel, Kebab, LoadingBox } from '../utils';
import { addIDPItems } from './oauth';

const stateToProps = (state: RootState) => ({
  configResources: state.k8s.getIn(['RESOURCES', 'configResources']),
  flags: state[featureReducerName],
});

const extensionsToProps = (extensions: Extension[]) => ({
  globalConfigs: extensions.filter(isGlobalConfig),
});

const editYAMLMenuItem = (name: string, resourceLink: string) => ({
  label: `Edit ${name} Resource`,
  href: `${resourceLink}/yaml`,
});

const viewAPIExplorerMenuItem = (name: string, apiExplorerLink: string) => ({
  label: `Explore ${name} API`,
  href: apiExplorerLink,
});

const oauthMenuItems = _.map(addIDPItems, (label: string, id: string) => ({
  label,
  href: `/settings/idp/${id}`,
}));

const ItemRow = ({item}) => {
  const resourceLink = resourcePathFromModel(item.model, item.name, item.namespace);
  const apiExplorerLink = `/api-resource/cluster/${referenceForModel(item.model)}`;
  const menuItems = [
    editYAMLMenuItem(item.kind, resourceLink),
    viewAPIExplorerMenuItem(item.kind, apiExplorerLink),
    ...(item.kind === 'OAuth') ? oauthMenuItems : [],
  ];

  return <div className="row co-resource-list__item">
    <div className="col-sm-12">
      <Link to={resourceLink}>{item.kind}</Link>
    </div>
    <div className="dropdown-kebab-pf">
      <Kebab options={menuItems} />
    </div>
  </div>;
};

class GlobalConfigPage_ extends React.Component<GlobalConfigPageProps, GlobalConfigPageState> {
  readonly state: GlobalConfigPageState = {
    errorMessage: '',
    items: [],
    loading: true,
  }

  componentDidMount() {
    let errorMessage = '';
    Promise.all(this.props.configResources.map((model: K8sKind) => {
      return k8sList(model)
        .catch(err => {
          errorMessage += `${err.message} `;
          this.setState({ errorMessage });
          return [];
        }).then(items => items.map((i: K8sKind) => ({...i, model})));
    })).then((responses) => {
      const flattenedResponses = _.flatten(responses);
      const winnowedResponses = flattenedResponses.map(item => ({model: item.model, uid: item.metadata.uid, name: item.metadata.name, namespace: item.metadata.namespace, kind: item.kind}));
      const sortedResponses = _.sortBy(_.flatten(winnowedResponses), 'kind', 'asc');

      this.setState({
        items: sortedResponses,
        loading: false,
      });
    });
  }

  checkFlags(c: GlobalConfig): GlobalConfigObjectProps {
    const { flags } = this.props;
    const { required } = c.properties;

    const requiredArray = required ? _.castArray(required) : [];
    const requirementMissing = _.some(requiredArray, flag => (
      flag && (flagPending(flags.get(flag)) || !flags.get(flag))
    ));
    return requirementMissing ? null : c.properties;
  }

  render() {
    const { errorMessage, items, loading } = this.state;

    const usableConfigs = this.props.globalConfigs.filter(item => this.checkFlags(item)).map(item => item.properties);
    const allItems = usableConfigs.length > 0 && items.concat(usableConfigs);
    const sortedItems = usableConfigs.length > 0 ? _.sortBy(_.flatten(allItems), 'kind', 'asc') : items;

    return <div className="co-m-pane__body">
      {errorMessage && <Alert isInline className="co-alert" variant="danger" title="Error loading resources">{errorMessage}</Alert>}
      {loading && <LoadingBox />}
      {!loading && <React.Fragment>
        <p className="co-m-pane__explanation">
          Edit the following resources to manage the configuration of your cluster.
        </p>
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-sm-10 col-xs-12">Configuration Resource</div>
            <div className="col-sm-2 hidden-xs"></div>
          </div>
          <div className="co-m-table-grid__body">
            { _.map(sortedItems, item => <ItemRow item={item} key={item.uid} />)}
          </div>
        </div>
      </React.Fragment>}
    </div>;
  }
}

export const GlobalConfigPage = connect(stateToProps)(connectToExtensions(extensionsToProps)(GlobalConfigPage_));

type GlobalConfigPageProps = {
  configResources: K8sKind[];
  globalConfigs: GlobalConfig[];
  flags?: FeatureState;
};

type GlobalConfigPageState = {
  errorMessage: string,
  items: any,
  loading: boolean,
};

type GlobalConfigObjectProps = {
  kind: string;
  model: K8sKind;
  name: string;
  namespace: string;
  uid: string;
}
