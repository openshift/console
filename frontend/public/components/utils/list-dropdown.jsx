import * as _ from 'lodash-es';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import * as PropTypes from 'prop-types';
import { Alert } from '@patternfly/react-core';

import { FLAGS } from '@console/shared/src/constants';
import { Dropdown } from './dropdown';
import { Firehose } from './firehose';
import { LoadingInline } from './status-box';
import { ResourceName } from './resource-icon';
import { connectToFlags, flagPending } from '../../reducers/features';

class ListDropdown_ extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: {},
    };

    if (props.selectedKey) {
      this.state.selectedKey = props.selectedKeyKind
        ? `${props.selectedKey}-${props.selectedKeyKind}`
        : props.selectedKey;
    }

    this.state.title = props.loaded ? props.placeholder : <LoadingInline />;

    this.autocompleteFilter = (text, item) => fuzzy(text, item.props.name);
    // Pass both the resource name and the resource kind to onChange()
    this.onChange = (key) => {
      const { name, kindLabel, resource } = _.get(this.state, ['items', key], {});
      this.setState({ selectedKey: key, title: <ResourceName kind={kindLabel} name={name} /> });
      this.props.onChange(name, kindLabel, resource);
    };
  }

  UNSAFE_componentWillMount() {
    // we need to trigger state changes to get past shouldComponentUpdate...
    //   but the entire working set of data can be loaded in memory at this point in time
    //   in which case componentWillReceiveProps would not be called for a while...
    this.UNSAFE_componentWillReceiveProps(this.props);
  }

  UNSAFE_componentWillReceiveProps({
    desc,
    placeholder,
    loaded,
    loadError,
    resources,
    dataFilter,
  }) {
    if (!loaded) {
      return;
    }

    this.setState(({ selectedKey }) => {
      if (loadError) {
        return {
          title: <div className="cos-error-title">Error Loading {desc}</div>,
        };
      }

      const unsortedList = {};
      _.each(resources, ({ data }, kindLabel) => {
        _.reduce(
          data,
          (acc, resource) => {
            if (!dataFilter || dataFilter(resource)) {
              acc[`${resource.metadata.name}-${kindLabel}`] = {
                kindLabel,
                name: resource.metadata.name,
                resource,
              };
            }
            return acc;
          },
          unsortedList,
        );
      });

      const sortedList = {};
      _.keys(unsortedList)
        .sort()
        .forEach((key) => {
          sortedList[key] = unsortedList[key];
        });
      const selectedItem = sortedList[selectedKey];
      return {
        items: sortedList,
        title: selectedItem ? (
          <ResourceName kind={selectedItem.kindLabel} name={selectedItem.name} />
        ) : (
          placeholder
        ),
      };
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(this.state, nextState);
  }

  render() {
    const { desc, fixed, placeholder, id, loaded, disabled } = this.props;
    const items = {};

    _.keys(this.state.items).forEach((key) => {
      const item = this.state.items[key];
      items[key] = <ResourceName kind={item.kindLabel} name={item.name} />;
    });

    const { selectedKey } = this.state;

    const Component = fixed ? (
      items[selectedKey]
    ) : (
      <Dropdown
        autocompleteFilter={this.autocompleteFilter}
        autocompletePlaceholder={placeholder}
        items={items}
        selectedKey={selectedKey}
        title={this.state.title}
        onChange={this.onChange}
        id={id}
        dropDownClassName="dropdown--full-width"
        menuClassName="dropdown-menu--text-wrap"
        disabled={disabled}
      />
    );

    return (
      <div>
        {Component}
        {loaded && _.isEmpty(items) && (
          <Alert
            isInline
            className="co-alert pf-c-alert--top-margin"
            variant="info"
            title={`No ${desc} found or defined`}
          />
        )}
      </div>
    );
  }
}

export const ListDropdown = (props) => {
  const resources = _.map(props.resources, (resource) =>
    _.assign({ isList: true, prop: resource.kind }, resource),
  );
  return (
    <Firehose resources={resources}>
      <ListDropdown_ {...props} />
    </Firehose>
  );
};

ListDropdown.propTypes = {
  dataFilter: PropTypes.func,
  desc: PropTypes.string,
  // specify both key/kind
  selectedKey: PropTypes.string,
  selectedKeyKind: PropTypes.string,
  fixed: PropTypes.bool,
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      kind: PropTypes.string.isRequired,
      namespace: PropTypes.string,
    }),
  ).isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  id: PropTypes.string,
};

const NsDropdown_ = (props) => {
  const openshiftFlag = props.flags[FLAGS.OPENSHIFT];
  if (flagPending(openshiftFlag)) {
    return null;
  }
  const kind = openshiftFlag ? 'Project' : 'Namespace';
  const resources = [{ kind }];
  return (
    <ListDropdown
      {...props}
      desc="Namespaces"
      resources={resources}
      selectedKeyKind={kind}
      placeholder="Select namespace"
    />
  );
};
/** @type {React.FC<{dataFilter?: (ns: any) => boolean, desc?: string, selectedKey?: string, selectedKeyKind?: string, fixed?: boolean, placeholder?: string, onChange?: (selectedKey: string, event: React.Event) => void, id?: string}}>} */
export const NsDropdown = connectToFlags(FLAGS.OPENSHIFT)(NsDropdown_);
