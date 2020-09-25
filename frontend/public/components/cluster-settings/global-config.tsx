import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { AlertVariant } from '@patternfly/react-core';

import { RootState } from '../../redux';
import { K8sKind, k8sList, referenceForModel, getResourceDescription } from '../../module/k8s';
import { EmptyBox, ExpandableAlert, Kebab, LoadingBox, resourcePathFromModel } from '../utils';
import { addIDPItems } from './oauth';
import { TextFilter } from '../factory';
import { fuzzyCaseInsensitive } from '../factory/table-filters';
import { withExtensions, isGlobalConfig, GlobalConfig } from '@console/plugin-sdk';

const stateToProps = (state: RootState) => ({
  configResources: state.k8s.getIn(['RESOURCES', 'configResources']),
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
        <Link to={item.path} data-test-id={item.label}>
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
    errors: [],
    items: [],
    loading: true,
    textFilter: '',
  };

  componentDidMount() {
    Promise.all(
      this.props.configResources.map((model: K8sKind) => {
        return k8sList(model)
          .catch(({ response: { status }, message = `Could not get resource ${model.kind}` }) => {
            if (status !== 403) {
              this.setState(({ errors }) => ({ errors: [...errors, message] }));
            }
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

      const usableConfigs = this.props.globalConfigs.map((item) => item.properties);

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

  render() {
    const { errors, items = [], loading, textFilter } = this.state;
    const visibleItems = items.filter(({ label, description = '' }) => {
      return (
        fuzzyCaseInsensitive(textFilter, label) ||
        description.toLowerCase().indexOf(textFilter.toLowerCase()) !== -1
      );
    });
    return (
      <>
        <div className="co-m-pane__body">
          {!loading && (
            <>
              <p className="co-help-text">
                Edit the following resources to manage the configuration of your cluster.
              </p>
              <div className="co-m-pane__filter-row">
                <TextFilter
                  value={textFilter}
                  label="by name or description"
                  onChange={(val) => this.setState({ textFilter: val })}
                />
              </div>
            </>
          )}
          {!_.isEmpty(errors) && (
            <ExpandableAlert
              variant={AlertVariant.danger}
              alerts={errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            />
          )}
          {loading && <LoadingBox />}
          {!loading &&
            (_.isEmpty(visibleItems) ? (
              <EmptyBox label="Configuration Resources" />
            ) : (
              <div className="co-m-table-grid co-m-table-grid--bordered">
                <div className="row co-m-table-grid__head">
                  <div className="col-xs-10 col-sm-4">Configuration Resource</div>
                  <div className="hidden-xs col-sm-7">Description</div>
                  <div />
                </div>
                <div className="co-m-table-grid__body">
                  {_.map(visibleItems, (item) => (
                    <ItemRow item={item} key={item.id} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </>
    );
  }
}

export const GlobalConfigPage = connect(stateToProps)(
  withExtensions<GlobalConfigPageExtensionProps>({ globalConfigs: isGlobalConfig })(
    GlobalConfigPage_,
  ),
);

type GlobalConfigPageExtensionProps = {
  globalConfigs: GlobalConfig[];
};

type GlobalConfigPageProps = GlobalConfigPageExtensionProps & {
  configResources: K8sKind[];
};

type GlobalConfigPageState = {
  errors: string[];
  items: any;
  loading: boolean;
  textFilter: string;
};
