import * as _ from 'lodash-es';
import * as React from 'react';
import classNames from 'classnames';
import * as PropTypes from 'prop-types';
import { Button } from 'patternfly-react/dist/js/components/Button';
import { EmptyState } from 'patternfly-react/dist/js/components/EmptyState';

import { LabelSelector } from '../../module/k8s/labelSelector';
import { namespaceProptype } from '../../propTypes';
import { SafetyFirst } from '../safety-first';
import { Select } from '../utils/select';

import { AppTopologyGroup } from './app-topology-group';
import { AppTopologyItem } from './app-topology-item';
import { AppTopologyDetails } from './app-topology-details';

export class AppTopology extends SafetyFirst {
  constructor(props) {
    super(props);

    this.state = {
      selectedId: '',
      selectedItem: null,
      filterValue: '',
      topologyItems: [],
      filteredItems: [],
      topologyGroups: null,
      groups: []
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.props.namespace !== prevProps.namespace ||
      this.props.replicationControllers !== prevProps.replicationControllers ||
      this.props.pods !== prevProps.pods ||
      this.props.deploymentConfigs !== prevProps.deploymentConfigs ||
      this.props.routes !== prevProps.routes ||
      this.props.services !== prevProps.services) {
      this.createTopologyData();
    } else if (_.get(this.state.selectedGroup, 'value') !== _.get(prevState.selectedGroup, 'value')) {
      this.setState({topologyGroups: this.createTopologyGroups(this.state.filteredItems)});
    } else if (this.state.filterValue !== prevState.filterValue) {
      const filteredItems = this.filterTopologyItems(this.state.topologyItems);
      this.setState({filteredItems, topologyGroups: this.createTopologyGroups(filteredItems)});
    }
  }

  sortByDeploymentVersion = (replicationControllers, descending) => {
    const compareDeployments = (left, right) => {
      const leftVersion = parseInt(_.get(left, 'openshift.io/deployment-config.latest-version'), 10);
      const rightVersion = parseInt(_.get(right, 'openshift.io/deployment-config.latest-version'), 10);

      // Fall back to sorting by name if no deployment versions.
      let leftName, rightName;
      if (!_.isFinite(leftVersion) && !_.isFinite(rightVersion)) {
        leftName = _.get(left, 'metadata.name', '');
        rightName = _.get(right, 'metadata.name', '');
        if (descending) {
          return rightName.localeCompare(leftName);
        }
        return leftName.localeCompare(rightName);
      }

      if (!leftVersion) {
        return descending ? 1 : -1;
      }

      if (!rightVersion) {
        return descending ? -1 : 1;
      }

      if (descending) {
        return rightVersion - leftVersion;
      }
      return leftVersion - rightVersion;
    };

    return _.toArray(replicationControllers).sort(compareDeployments);
  };

  filterTopologyItems = items => {
    const {filterValue} = this.state;

    if (!filterValue) {
      return items;
    }

    const filterString = filterValue.toLowerCase();
    let filteredItems = [];
    _.forEach(items, item => {
      const name = _.get(item.deploymentConfig, 'metadata.name', '');
      if (name.toLowerCase().includes(filterString)) {
        filteredItems.push(item);
      }
    });

    return filteredItems;
  };

  createTopologyGroups = items => {
    const {selectedGroup} = this.state;

    if (!selectedGroup) {
      return null;
    }

    let topologyGroups = [{name: 'none', items: []}];

    _.forEach(items, item => {
      const labels = _.get(item.deploymentConfig, 'metadata.labels');

      const labelValue = _.get(labels, selectedGroup.value, 'none');
      const group = topologyGroups.find(topologyGroup => topologyGroup.name === labelValue);
      if (group) {
        group.items.push(item);
      } else {
        topologyGroups.push({name: labelValue, items: [item]});
      }
    });

    topologyGroups.sort((a, b) => {
      if (a.name === 'none') {
        return 1;
      } else if (b.name === 'none') {
        return -1;
      }

      return a.name.localeCompare(b.name);
    });

    return topologyGroups;
  };

  createTopologyData = () => {
    const {loaded, replicationControllers, pods, deploymentConfigs, routes, services} = this.props;
    const {selectedId} = this.state;
    let topologyItems = [];
    let allGroups = [];

    if (!loaded) {
      return;
    }

    _.forEach(replicationControllers.data, function (replicationController) {
      const controllerUID = _.get(replicationController, 'metadata.uid');
      replicationController.pods = _.filter(pods.data, function (pod) {
        return _.some(_.get(pod, 'metadata.ownerReferences'), {
          uid: controllerUID,
          controller: true
        });
      });
    });

    let allServices = _.keyBy(services.data, 'metadata.name');
    const selectorsByService = _.mapValues(allServices, function (service) {
      return new LabelSelector(service.spec.selector);
    });

    _.forEach(deploymentConfigs.data, (deploymentConfig) => {
      deploymentConfig.kind = "DeploymentConfig";
      // Determine the replication controllers associated with this DC
      const dcUID = _.get(deploymentConfig, 'metadata.uid');
      const dcControllers = _.filter(replicationControllers.data, function (replicationController) {
        return _.some(_.get(replicationController, 'metadata.ownerReferences'), {
          uid: dcUID,
          controller: true
        });
      });
      const ordered = this.sortByDeploymentVersion(dcControllers, true);
      deploymentConfig.replicationControllers = dcControllers;
      deploymentConfig.currentController = _.head(ordered);
      deploymentConfig.prevController = _.size(ordered) < 2 ? null : ordered[1];

      // Get the services for this deployment config
      let configServices = [];
      const configTemplate = _.get(deploymentConfig, 'spec.template');
      _.each(selectorsByService, (selector, serviceName) => {
        if (selector.matches(configTemplate)) {
          configServices.push(allServices[serviceName]);
        }
      });

      let configRoutes = [];
      _.forEach(configServices, service => {
        _.forEach(routes.data, route => {
          if (_.get(service, 'metadata.name') === _.get(route, 'spec.to.name')) {
            route.kind = 'Route';
            configRoutes.push(route);
          }
        });
      });

      topologyItems.push({
        deploymentConfig,
        routes: configRoutes
      });
    });

    // Find the selected Item and create the list of groups
    let selectedItem = null;
    _.forEach(topologyItems, item => {
      if (selectedId) {
        if (_.get(item.deploymentConfig, 'metadata.uid') === selectedId) {
          selectedItem = item.deploymentConfig;
        } else {
          _.forEach(item.routes, route => {
            if (_.get(route, 'metadata.uid') === selectedId) {
              selectedItem = route;
            }
          })
        }
      }
      const labels = _.get(item.deploymentConfig, 'metadata.labels');
      _.forEach(_.keys(labels), grouping => {
        if (!_.find(allGroups, nextGroup => nextGroup.label === grouping)) {
          allGroups.push({value: grouping, label: grouping});
        }
      });
    });

    allGroups.sort((a, b) => a.label.localeCompare(b.label));

    const filteredItems = this.filterTopologyItems(topologyItems);

    this.setState({
      topologyItems,
      filteredItems,
      topologyGroups: this.createTopologyGroups(filteredItems),
      groups: allGroups,
      selectedItem
    });
  };

  handleItemClick = item => {
    const {selectedItem} = this.state;

    if (!item) {
      return;
    }

    const newSelectedItem = (item === selectedItem) ? null : item;

    this.setState({
      selectedId: _.get(newSelectedItem, 'metadata.uid'),
      selectedItem: newSelectedItem
    });
  };

  handleGroupChange = selectedGroup => {
    this.setState({selectedGroup});
  };

  handleFilterChange = event => {
    this.setState({filterValue: event.target.value});
  };

  clearFilter = () => {
    this.setState({filterValue: ''});
  };

  onCloseDetails = () => {
    this.setState({
      selectedId: '',
      selectedItem: null
    });
  };

  renderHeader() {
    const { groups, selectedGroup, filterValue } = this.state;

    return (
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group">
          <input
            type="text"
            autoCapitalize="none"
            className="form-control text-filter"
            placeholder="Filter Deployment Configs by name..."
            onChange={this.handleFilterChange}
            value={filterValue}
            onKeyDown={e => e.key === 'Escape' && e.target.blur()}
          />
        </div>
        <div className="co-m-pane__filter-bar-group">
          <span className="co-m-pane__filter-bar-group-label">
            Group by
          </span>
          <span className="co-m-pane__filter-bar-group-value">
            <Select
              name="group"
              value={selectedGroup}
              options={groups}
              disabled={!_.size(groups)}
              placeholder="Select a grouping..."
              onChange={this.handleGroupChange}
            />
          </span>
        </div>
      </div>

    );
  }

  renderItems() {
    const { topologyGroups, filteredItems, selectedGroup, selectedItem } = this.state;

    if (selectedGroup) {
      return _.map(topologyGroups, group =>
        <AppTopologyGroup
          key={`topology-group-${group.name}`}
          group={group}
          selectedGroup={selectedGroup.value}
          selectedItem={selectedItem}
          handleItemClick={this.handleItemClick}/>
      );
    }

    return _.map(filteredItems, item =>
      <AppTopologyItem
        key={_.get(item.deploymentConfig, 'metadata.uid')}
        deploymentConfig={item.deploymentConfig}
        routes={item.routes}
        selectedItem={selectedItem}
        handleItemClick={this.handleItemClick}/>
      );
  };

  renderView() {
    const { filteredItems } = this.state;

    if (!_.size(filteredItems)) {
      return (
        <EmptyState>
          <EmptyState.Title>
            No Results Match the Filter Criteria
          </EmptyState.Title>
          <EmptyState.Info>
            The filter text does not match any of the current Deployment Config names.
          </EmptyState.Info>
          <EmptyState.Action>
            <Button bsStyle="link" onClick={this.clearFilter}>
              Clear Filter
            </Button>
          </EmptyState.Action>
        </EmptyState>
      );
    }

    return (
      <div className="app-topology-list-view">
        {this.renderItems()}
      </div>
    );
  }

  render() {
    const { namespace, loaded } = this.props;
    const { selectedItem, topologyItems } = this.state;

    if (!loaded) {
      return (
        <div className="app-topology">
          <EmptyState>
            <EmptyState.Icon type="pf" name="in-progress">
            </EmptyState.Icon>
            <EmptyState.Info>
              Loading
            </EmptyState.Info>
          </EmptyState>
        </div>
      );

    }

    if (!_.size(topologyItems)) {
      return (
        <div className="app-topology">
          <EmptyState>
            <EmptyState.Info>
              No Deployment Configs Found
            </EmptyState.Info>
          </EmptyState>
        </div>
      );
    }

    const viewClasses = classNames('app-topology-view', {'details-shown' : selectedItem});
    return (
      <div className="app-topology">
        {this.renderHeader()}
        <div className={viewClasses}>
          {this.renderView()}
          <AppTopologyDetails item={selectedItem} namespace={namespace} onClose={this.onCloseDetails} />
        </div>
      </div>
    );
  }
}

AppTopology.defaultProps = {
};

AppTopology.propTypes = {
  namespace: namespaceProptype,
  replicationControllers: PropTypes.object,
  pods: PropTypes.object,
  deploymentConfigs: PropTypes.object,
  routes: PropTypes.object,
  services: PropTypes.object
};
