import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Alert } from '@patternfly/react-core';
import * as plugins from '../../plugins';

import { RootState } from '../../redux';
import { featureReducerName, flagPending, FeatureState } from '../../reducers/features';
import { K8sKind, k8sList, referenceForModel, getResourceDescription } from '../../module/k8s';
import { resourcePathFromModel, Kebab, LoadingBox } from '../utils';
import { addIDPItems } from './oauth';

const stateToProps = (state: RootState) => ({
  configResources: state.k8s.getIn(['RESOURCES', 'configResources']),
  flags: state[featureReducerName],
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

const ItemRow = ({ item }) => {
  return (
    <div className="row co-resource-list__item" data-test-action={item.label}>
      <div className="col-xs-10 col-sm-4">
        <Link to={item.path} data-test-id={item.id}>
          {item.label}
        </Link>
      </div>
      <div className="hidden-xs col-sm-7">
        <div className="co-line-clamp">{item.description || '-'}</div>
      </div>
      <div className="dropdown-kebab-pf">
        <Kebab options={item.menuItems} />
      </div>
    </div>
  );
};

class GlobalConfigPage_ extends React.Component<GlobalConfigPageProps, GlobalConfigPageState> {
  readonly state: GlobalConfigPageState = {
    errorMessage: '',
    items: [],
    loading: true,
  };

  getGlobalConfigs(): plugins.GlobalConfig[] {
    return plugins.registry.getGlobalConfigs();
  }

  componentDidMount() {
    let errorMessage = '';
    Promise.all(
      this.props.configResources.map((model: K8sKind) => {
        return k8sList(model)
          .catch((err) => {
            errorMessage += `${err.message} `;
            this.setState({ errorMessage });
            return [];
          })
          .then((items) => items.map((i: K8sKind) => ({ ...i, model })));
      }),
    ).then((responses) => {
      const flattenedResponses = _.flatten(responses);
      const winnowedResponses = flattenedResponses.map((item) => ({
        model: item.model,
        uid: item.metadata.uid,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        kind: item.kind,
      }));

      const globalConfigs = this.getGlobalConfigs();
      const usableConfigs = globalConfigs
        .filter((item) => this.checkFlags(item))
        .map((item) => item.properties);

      const allItems = [...winnowedResponses, ...usableConfigs]
        .map((item) => {
          const apiExplorerLink = `/api-resource/cluster/${referenceForModel(item.model)}`;
          const resourceLink = resourcePathFromModel(item.model, item.name, item.namespace);
          return {
            label: item.kind,
            id: item.uid,
            description: getResourceDescription(item.model),
            path: resourceLink,
            menuItems: [
              editYAMLMenuItem(item.kind, resourceLink),
              viewAPIExplorerMenuItem(item.kind, apiExplorerLink),
              ...(item.kind === 'OAuth' ? oauthMenuItems : []),
            ],
          };
        })
        .concat([
          {
            label: 'Alertmanager',
            id: 'alertmanager',
            description: 'Configure grouping and routing of alerts',
            path: '/monitoring/alertmanagerconfig',
            menuItems: [
              {
                label: 'Create Receiver',
                href: '/monitoring/alertmanagerconfig/receivers/~new',
              },
              {
                label: `Edit Configuration YAML`,
                href: `/monitoring/alertmanageryaml`,
              },
            ],
          },
        ]);
      const sortedItems = _.sortBy(_.flatten(allItems), 'label', 'asc');

      this.setState({
        items: sortedItems,
        loading: false,
      });
    });
  }

  checkFlags(c: plugins.GlobalConfig): GlobalConfigObjectProps {
    const { flags } = this.props;
    const { required } = c.properties;

    const requiredArray = required ? _.castArray(required) : [];
    const requirementMissing = _.some(
      requiredArray,
      (flag) => flag && (flagPending(flags.get(flag)) || !flags.get(flag)),
    );
    return requirementMissing ? null : c.properties;
  }

  render() {
    const { errorMessage, items, loading } = this.state;
    return (
      <div className="co-m-pane__body">
        {errorMessage && (
          <Alert isInline className="co-alert" variant="danger" title="Error loading resources">
            {errorMessage}
          </Alert>
        )}
        {loading && <LoadingBox />}
        {!loading && (
          <>
            <p className="co-m-pane__explanation">
              Edit the following resources to manage the configuration of your cluster.
            </p>
            <div className="co-m-table-grid co-m-table-grid--bordered">
              <div className="row co-m-table-grid__head">
                <div className="col-xs-10 col-sm-4">Configuration Resource</div>
                <div className="hidden-xs col-sm-7">Description</div>
                <div />
              </div>
              <div className="co-m-table-grid__body">
                {_.map(items, (item) => (
                  <ItemRow item={item} key={item.id} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}

export const GlobalConfigPage = connect(stateToProps)(GlobalConfigPage_);

type GlobalConfigPageProps = {
  configResources: K8sKind[];
  flags?: FeatureState;
};

type GlobalConfigPageState = {
  errorMessage: string;
  items: any;
  loading: boolean;
};

type GlobalConfigObjectProps = {
  kind: string;
  model: K8sKind;
  name: string;
  namespace: string;
  uid: string;
};
