/* eslint-disable no-undef, no-unused-vars */
import * as _ from 'lodash-es';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';

import { Firehose, LoadingInline, Dropdown, ResourceName, ResourceIcon } from '.';
import { isDefaultClass } from '../storage-class';

/* Component StorageClassDropdown - creates a dropdown list of storage classes */

class StorageClassDropdown_ extends React.Component<StorageClassDropdownProps, StorageClassDropdownState> {
  readonly state: StorageClassDropdownState = {
    items: {},
    name: this.props.name,
    selectedKey: null,
    title: <LoadingInline />,
    defaultClass: null,
  };

  componentWillMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const { loaded, loadError, resources } = nextProps;

    if (loadError) {
      this.setState({
        title: (
          <div className="cos-error-title">Error Loading {nextProps.desc}</div>
        ),
      });
      return;
    }
    if (!loaded) {
      return;
    }

    const state = {
      items: {},
      title: {},
      defaultClass: '',
    };
    const unorderedItems = {};
    const noStorageClass = 'No default storage class';
    _.map(resources.StorageClass.data, resource => {
      unorderedItems[resource.metadata.name] = {
        kindLabel: 'StorageClass',
        name: resource.metadata.name,
        description: _.get(resource, 'metadata.annotations.description', ''),
        default: isDefaultClass(resource),
        accessMode:  _.get(resource, ['metadata', 'annotations', 'storage.alpha.openshift.io/access-mode'], ''),
        provisioner: resource.provisioner,
        type: _.get(resource, 'parameters.type', ''),
        zone: _.get(resource, 'parameters.zone', ''),
        resource,
      };
    },
    );

    // Determine if there is a default storage class
    state.defaultClass = _.findKey(unorderedItems, 'default');
    const { selectedKey } = this.state;
    if (!state.defaultClass) {
      // Add No Storage Class option if there is not a default storage class
      unorderedItems[''] = { kindLabel: '', name: noStorageClass };
    }

    if (!this.props.loaded || !selectedKey ) {
      state.title = <span className="text-muted">Select storage class</span>;
    }

    const selectedItem = unorderedItems[selectedKey || state.defaultClass];
    if (selectedItem) {
      state.title = this.getTitle(selectedItem);
    }

    Object.keys(unorderedItems).sort().forEach((key) => {
      state.items[key] = unorderedItems[key];
    });
    this.setState(state);
  }

  componentDidUpdate() {
    const {defaultClass, selectedKey } = this.state;
    if (!selectedKey && defaultClass) {
      this.onChange(defaultClass);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(this.state, nextState);
  }

  autocompleteFilter = (text, item) => fuzzy(text, item.props.name);

  getTitle = storageClass => {
    return storageClass.kindLabel ? <ResourceName kind="StorageClass" name={storageClass.name} /> : <span >{storageClass.name}</span>;
  }

  onChange = key => {
    const storageClass = _.get(this.state, ['items', key], {});
    this.setState({
      selectedKey: key,
      title: this.getTitle(storageClass),
    });
    this.props.onChange(storageClass.resource);
  };

  render() {
    const { id, loaded, describedBy } = this.props;
    const items = {};
    _.each(
      this.state.items,
      (props, key) =>
        (items[key] = key ? <StorageClassDropdownEntry {...props} /> : <StorageClassDropdownNoStorageClassOption {...props} />)
    );

    const { selectedKey, defaultClass } = this.state;

    // Only show the dropdown if 'no storage class' is not the only option which depends on defaultClass
    const itemsAvailableToShow = defaultClass || _.size(items) > 1;
    return <React.Fragment>
      {loaded && itemsAvailableToShow &&
        <div>
          <label className="control-label" htmlFor={id}>
            Storage Class
          </label>
          <Dropdown
            autocompleteFilter={this.autocompleteFilter}
            autocompletePlaceholder="Select storage class"
            items={items}
            selectedKey={selectedKey}
            title={this.state.title}
            onChange={this.onChange}
            id={id}
            menuClassName="dropdown-menu--text-wrap"
          />
          <p className="help-block" id={describedBy}>
            Storage class for the new claim.
          </p>
        </div>
      }
    </React.Fragment>;
  }
}

export const StorageClassDropdown = props => {
  return <Firehose resources={[{ kind: 'StorageClass', prop: 'StorageClass', isList: true }]}>
    <StorageClassDropdown_ {...props} />
  </Firehose>;
};

const StorageClassDropdownEntry = props => {
  const storageClassProperties = [props.default ? ' (default)' : '', props.description, props.accessMode, props.provisioner, props.type, props.zone];
  const storageClassDescriptionLine = _.compact(storageClassProperties).join(' | ');
  return <div className="form__storage-class-dropdown__flex-column">
    <div className="form__storage-class-dropdown__flex-row">
      <span className="form__storage-class-dropdown__icon-column"><ResourceIcon kind={props.kindLabel} /></span> <span>{props.name}</span>
    </div>
    <div className="form__storage-class-dropdown__flex-row">
      <div className="form__storage-class-dropdown__icon-column"> &nbsp;</div><div className="text-muted"> {storageClassDescriptionLine}</div>
    </div>
  </div>;
};

const StorageClassDropdownNoStorageClassOption = props => {
  return <div className="form__storage-class-dropdown__flex-column">
    <div className="form__storage-class-dropdown__flex-row">
      <span className="form__storage-class-dropdown__icon-column"></span> <span>{props.name}</span>
    </div>
  </div>;
};

export type StorageClassDropdownState = {
  items: any;
  name: string;
  selectedKey: string;
  title: React.ReactNode;
  defaultClass: string;
};

export type StorageClassDropdownProps = {
  id?: string;
  loaded?: boolean;
  resources?: any;
  name: string;
  onChange: (object) => void;
  describedBy: string;
};
