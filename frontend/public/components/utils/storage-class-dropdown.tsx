/* eslint-disable @typescript-eslint/no-use-before-define */
import * as _ from 'lodash';
import type { ReactNode } from 'react';
import { Component } from 'react';
import * as fuzzy from 'fuzzysearch';
/* eslint-disable import/named */
import { WithTranslation, withTranslation } from 'react-i18next';

import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { Firehose } from './firehose';
import { LoadingInline } from './status-box';
import { ResourceName, ResourceIcon } from './resource-icon';
import { isDefaultClass } from '../storage-class';
import { css } from '@patternfly/react-styles';

/* Component StorageClassDropdown - creates a dropdown list of storage classes */

export class StorageClassDropdownInnerWithTranslation extends Component<
  StorageClassDropdownInnerProps,
  StorageClassDropdownInnerState
> {
  readonly state: StorageClassDropdownInnerState = {
    items: {},
    name: this.props.name,
    selectedKey: this.props.selectedKey,
    title: <LoadingInline />,
    defaultClass: this.props.defaultClass,
  };

  UNSAFE_componentWillMount() {
    this.UNSAFE_componentWillReceiveProps(this.props);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { loaded, loadError, resources, t } = nextProps;

    if (loadError) {
      this.setState({
        title: (
          <div className="cos-error-title">
            {t('public~Error loading {{desc}}', { desc: nextProps.desc })}
          </div>
        ),
      });
      return;
    }
    if (!loaded) {
      return;
    }

    const state = {
      items: {},
      title: undefined,
      defaultClass: '',
    };
    let unorderedItems = {};
    const noStorageClass = t('public~No default StorageClass');
    _.map(resources.StorageClass.data, (resource) => {
      unorderedItems[resource.metadata.name] = {
        kindLabel: 'StorageClass',
        name: resource.metadata.name,
        description: _.get(resource, 'metadata.annotations.description', ''),
        default: isDefaultClass(resource),
        accessMode: _.get(
          resource,
          ['metadata', 'annotations', 'storage.alpha.openshift.io/access-mode'],
          '',
        ),
        provisioner: resource.provisioner,
        parameters: resource.parameters,
        type: _.get(resource, 'parameters.type', ''),
        zone: _.get(resource, 'parameters.zone', ''),
        resource,
      };
    });

    //Filter if user provides a custom function
    if (nextProps.filter) {
      unorderedItems = Object.keys(unorderedItems)
        .filter((sc) => nextProps.filter(unorderedItems[sc]))
        .reduce((acc, key) => {
          acc[key] = unorderedItems[key];
          return acc;
        }, {});
    }

    // Determine if there is a default storage class
    state.defaultClass = _.findKey(unorderedItems, 'default');
    const { selectedKey } = this.state;
    if (!state.defaultClass) {
      // Add No Storage Class option if there is not a default storage class
      unorderedItems[''] = { kindLabel: '', name: noStorageClass };
    }

    if (!this.props.loaded || !selectedKey || !unorderedItems[selectedKey || state.defaultClass]) {
      state.title = (
        <span className="pf-v6-u-text-color-subtle">{t('public~Select StorageClass')}</span>
      );
    }

    const selectedItem = unorderedItems[selectedKey || state.defaultClass];
    if (selectedItem) {
      state.title = this.getTitle(selectedItem);
    }

    Object.keys(unorderedItems)
      .sort()
      .forEach((key) => {
        state.items[key] = unorderedItems[key];
      });
    this.setState(state);
  }

  componentDidMount() {
    const { defaultClass } = this.state;
    if (defaultClass) {
      this.onChange(defaultClass);
    }
  }

  componentDidUpdate() {
    const { defaultClass, selectedKey } = this.state;
    if (selectedKey) {
      this.onChange(selectedKey);
    } else if (defaultClass) {
      this.onChange(defaultClass);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(this.state, nextState);
  }

  autocompleteFilter = (text, item) => fuzzy(text, item.props.name);

  getTitle = (storageClass) => {
    return storageClass.kindLabel ? (
      <ResourceName kind="StorageClass" name={storageClass.name} />
    ) : (
      <span>{storageClass.name}</span>
    );
  };

  onChange = (key) => {
    const storageClass = _.get(this.state, ['items', key], {});
    this.setState(
      {
        selectedKey: key,
        title: this.getTitle(storageClass),
      },
      () => this.props.onChange(storageClass.resource),
    );
  };

  render() {
    const { id, loaded, describedBy, t } = this.props;
    const items = {};
    _.each(
      this.state.items,
      (props, key) =>
        (items[key] = key ? (
          <StorageClassDropdownEntry {...props} />
        ) : (
          <StorageClassDropdownNoStorageClassOption {...props} />
        )),
    );

    const { selectedKey, defaultClass } = this.state;

    // Only show the dropdown if 'no storage class' is not the only option which depends on defaultClass
    const itemsAvailableToShow = defaultClass || _.size(items) > 1;
    return (
      <>
        {loaded && itemsAvailableToShow && (
          <div>
            <label
              className={css(this.props.hideClassName, {
                'co-required': this.props.required,
              })}
              htmlFor={id}
            >
              {t('public~StorageClass')}
            </label>
            <ConsoleSelect
              className="co-storage-class-dropdown"
              isFullWidth
              autocompleteFilter={this.autocompleteFilter}
              autocompletePlaceholder={t('public~Select StorageClass')}
              items={items}
              selectedKey={selectedKey}
              title={this.state.title}
              alwaysShowTitle
              onChange={this.onChange}
              id={id}
              dataTest={this.props?.['data-test']}
              menuClassName="dropdown-menu--text-wrap"
            />
            {describedBy && (
              <p className="help-block" id={describedBy}>
                {t('public~StorageClass for the new claim')}
              </p>
            )}
          </div>
        )}
      </>
    );
  }
}

export const StorageClassDropdownInner = withTranslation()(
  StorageClassDropdownInnerWithTranslation,
);

export const StorageClassDropdown = (props) => {
  return (
    <Firehose resources={[{ kind: 'StorageClass', prop: 'StorageClass', isList: true }]}>
      <StorageClassDropdownInner {...props} />
    </Firehose>
  );
};

const StorageClassDropdownEntry = (props) => {
  const storageClassProperties = [
    props.default ? ' (default)' : '',
    props.description,
    props.accessMode,
    props.provisioner,
    props.type,
    props.zone,
  ];
  const storageClassDescriptionLine = _.compact(storageClassProperties).join(' | ');
  return (
    <span className="co-resource-item">
      <ResourceIcon kind={props.kindLabel} />
      <span className="co-resource-item__resource-name">
        {props.name}
        <div className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">
          {' '}
          {storageClassDescriptionLine}
        </div>
      </span>
    </span>
  );
};

const StorageClassDropdownNoStorageClassOption = (props) => {
  return (
    <span className="co-resource-item">
      <span className="co-resource-item__resource-name">{props.name}</span>
    </span>
  );
};

export type StorageClassDropdownInnerState = {
  items: any;
  name: string;
  selectedKey: string;
  title: ReactNode;
  defaultClass: string;
};

export type StorageClassDropdownInnerProps = WithTranslation & {
  id?: string;
  loaded?: boolean;
  loadError?: any;
  resources?: any;
  name: string;
  onChange: (object) => void;
  describedBy: string;
  desc?: string;
  defaultClass: string;
  required?: boolean;
  hideClassName?: string;
  filter?: (param) => boolean;
  selectedKey?: string;
};
