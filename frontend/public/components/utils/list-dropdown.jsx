import * as _ from 'lodash-es';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import * as PropTypes from 'prop-types';

import { Dropdown, Firehose, LoadingInline, ResourceName } from './';
import { connectToFlags, FLAGS, flagPending } from '../../features';

class ListDropdown_ extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: {},
    };

    if (props.selectedKey) {
      this.state.selectedKey = props.selectedKeyKind ? `${props.selectedKey}-${props.selectedKeyKind}` : props.selectedKey;
    }

    this.state.title = props.loaded ? <span className="text-muted">{props.placeholder}</span> : <LoadingInline />;

    this.autocompleteFilter = (text, item) => fuzzy(text, item.props.name);
    // Pass both the resource name and the resource kind to onChange()
    this.onChange = key => {
      const {name, kindLabel} = _.get(this.state, ['items', key], {});
      this.setState({selectedKey: key, title: <ResourceName kind={kindLabel} name={name} />});
      this.props.onChange(name, kindLabel);
    };
  }

  componentWillMount() {
    // we need to trigger state changes to get past shouldComponentUpdate...
    //   but the entire working set of data can be loaded in memory at this point in time
    //   in which case componentWillReceiveProps would not be called for a while...
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const {loaded, loadError} = nextProps;

    if (loadError) {
      this.setState({
        title: <div className="cos-error-title">Error Loading {nextProps.desc}</div>,
      });
      return;
    }

    if (!loaded) {
      return;
    }
    const state = {};
    const { resources, dataFilter } = nextProps;

    state.items = {};
    _.each(resources, ({data}, kindLabel) => {
      _.reduce(data, (acc, resource) => {
        if (!dataFilter || dataFilter(resource)) {
          acc[`${resource.metadata.name}-${kindLabel}`] = {kindLabel, name: resource.metadata.name};
        }
        return acc;
      }, state.items);
    });

    const { selectedKey } = this.state;
    // did we switch from !loaded -> loaded ?
    if (!this.props.loaded && !selectedKey) {
      state.title = <span className="text-muted">{nextProps.placeholder}</span>;
    }

    if (selectedKey) {
      const item = state.items[selectedKey];
      // item may not exist if selectedKey is a role and then user switches to creating a ClusterRoleBinding
      if (item) {
        state.title = <ResourceName kind={item.kindLabel} name={item.name} />;
      }
    }

    this.setState(state);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (_.isEqual(this.state, nextState)) {
      return false;
    }
    return true;
  }

  render() {
    const {desc, fixed, placeholder, id, loaded} = this.props;
    const items = {};
    const sortedItems = _.keys(this.state.items).sort();

    _.each(this.state.items, (v, key) => items[key] = <ResourceName kind={v.kindLabel} name={v.name} />);

    const {selectedKey} = this.state;

    const Component = fixed
      ? items[selectedKey]
      : <Dropdown
        autocompleteFilter={this.autocompleteFilter}
        autocompletePlaceholder={placeholder}
        items={items}
        sortedItemKeys={sortedItems}
        selectedKey={selectedKey}
        title={this.state.title}
        onChange={this.onChange}
        id={id}
        menuClassName="dropdown-menu--text-wrap" />;

    return <div>
      { Component }
      { loaded && _.isEmpty(items) && <p className="alert alert-info"><span className="pficon pficon-info" aria-hidden="true"></span>No {desc} found or defined.</p> }
    </div>;
  }
}

export const ListDropdown = props => {
  const resources = _.map(props.resources, resource => _.assign({ isList: true, prop: resource.kind }, resource));
  return <Firehose resources={resources}>
    <ListDropdown_ {...props} />
  </Firehose>;
};

ListDropdown.propTypes = {
  dataFilter: PropTypes.func,
  desc: PropTypes.string,
  // specify both key/kind
  selectedKey: PropTypes.string,
  selectedKeyKind: PropTypes.string,
  fixed: PropTypes.bool,
  resources: PropTypes.arrayOf(PropTypes.shape({
    kind: PropTypes.string.isRequired,
    namespace: PropTypes.string,
  })).isRequired,
  placeholder: PropTypes.string,
};

const NsDropdown_ = props => {
  const openshiftFlag = props.flags[FLAGS.OPENSHIFT];
  if (flagPending(openshiftFlag)) {
    return null;
  }
  const kind = openshiftFlag ? 'Project' : 'Namespace';
  const resources = [{ kind }];
  return <ListDropdown {...props} desc="Namespaces" resources={resources} selectedKeyKind={kind} placeholder="Select namespace" />;
};
export const NsDropdown = connectToFlags(FLAGS.OPENSHIFT)(NsDropdown_);
