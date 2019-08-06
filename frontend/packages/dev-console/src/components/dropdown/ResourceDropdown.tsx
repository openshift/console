import * as _ from 'lodash';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { Dropdown, LoadingInline } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';

type FirehoseList = {
  data?: K8sResourceKind[];
  [key: string]: any;
};

interface State {
  items: {};
  title: React.ReactNode;
}

interface ResourceDropdownProps {
  id?: string;
  className?: string;
  dropDownClassName?: string;
  menuClassName?: string;
  buttonClassName?: string;
  title?: React.ReactNode;
  titlePrefix?: string;
  allApplicationsKey?: string;
  storageKey?: string;
  disabled?: boolean;
  allSelectorItem?: {
    allSelectorKey?: string;
    allSelectorTitle?: string;
  };
  actionItem?: {
    actionTitle: string;
    actionKey: string;
  };
  dataSelector: string[] | number[] | symbol[];
  loaded?: boolean;
  loadError?: string;
  placeholder?: string;
  resources?: FirehoseList[];
  selectedKey: string;
  autoSelect?: boolean;
  resourceFilter?: (resource: any) => boolean;
  onChange?: (key: string, name?: string) => void;
}

class ResourceDropdown extends React.Component<ResourceDropdownProps, State> {
  constructor(props) {
    super(props);
    this.state = {
      items: {},
      title: this.props.loaded ? (
        <span className="btn-dropdown__item--placeholder">{this.props.placeholder}</span>
      ) : (
        <LoadingInline />
      ),
    };
  }

  componentWillReceiveProps(nextProps: ResourceDropdownProps) {
    const {
      resources,
      loaded,
      loadError,
      placeholder,
      allSelectorItem,
      resourceFilter,
      dataSelector,
      selectedKey,
      autoSelect,
    } = nextProps;

    if (!loaded) {
      this.setState({ title: <LoadingInline /> });
      return;
    }

    // If autoSelect is true only then have an item pre-selected based on selectedKey.
    if (autoSelect) {
      const dropdownItem =
        this.props.loaded && _.isEmpty(this.state.items) && this.props.actionItem
          ? this.props.actionItem.actionKey
          : _.get(_.keys(this.state.items), 0);
      const selectedItemKey = selectedKey || dropdownItem;
      this.onChange(selectedItemKey);
    } else if (!this.props.loaded || !selectedKey) {
      this.setState({
        title: <span className="btn-dropdown__item--placeholder">{placeholder}</span>,
      });
    }

    if (loadError) {
      this.setState({
        title: <span className="cos-error-title">Error Loading - {placeholder}</span>,
      });
    }

    const unsortedList = {};
    _.each(resources, ({ data }) => {
      _.reduce(
        data,
        (acc, resource) => {
          let dataValue;
          if (resourceFilter && resourceFilter(resource)) {
            dataValue = _.get(resource, dataSelector);
          } else if (!resourceFilter) {
            dataValue = _.get(resource, dataSelector);
          }
          if (dataValue) {
            acc[dataValue] = dataValue;
          }
          return acc;
        },
        unsortedList,
      );
    });

    const sortedList = {};

    if (allSelectorItem && !_.isEmpty(unsortedList)) {
      sortedList[allSelectorItem.allSelectorKey] = allSelectorItem.allSelectorTitle;
    }

    _.keys(unsortedList)
      .sort()
      .forEach((key) => {
        sortedList[key] = unsortedList[key];
      });

    this.setState({ items: sortedList });
    if (
      (_.isEmpty(sortedList) || !sortedList[this.props.selectedKey]) &&
      allSelectorItem &&
      allSelectorItem.allSelectorKey !== this.props.selectedKey
    ) {
      this.onChange(allSelectorItem.allSelectorKey);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (_.isEqual(this.state, nextState) && _.isEqual(this.props, nextProps)) {
      return false;
    }
    return true;
  }

  private onChange = (key: string) => {
    const name = this.state.items[key];
    const { actionItem, onChange } = this.props;
    const title = actionItem && key === actionItem.actionKey ? actionItem.actionTitle : name;
    if (title !== this.state.title) {
      onChange && this.props.onChange(key, name);
      this.setState({ title });
    }
  };

  render() {
    return (
      <Dropdown
        id={this.props.id}
        className={this.props.className}
        dropDownClassName={this.props.dropDownClassName}
        menuClassName={this.props.menuClassName}
        buttonClassName={this.props.buttonClassName}
        titlePrefix={this.props.titlePrefix}
        autocompleteFilter={fuzzy}
        actionItem={this.props.actionItem}
        items={this.state.items}
        onChange={this.onChange}
        selectedKey={this.props.selectedKey}
        title={this.props.title || this.state.title}
        autocompletePlaceholder={this.props.placeholder}
        storageKey={this.props.storageKey}
        disabled={this.props.disabled}
      />
    );
  }
}

export default ResourceDropdown;
