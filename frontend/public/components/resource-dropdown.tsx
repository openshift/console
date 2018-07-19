/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { connect } from 'react-redux';
import * as PropTypes from 'prop-types';
import { Map as ImmutableMap } from 'immutable';
import * as classNames from 'classnames';

import { Dropdown, ResourceIcon } from './utils';
import { K8sKind, K8sResourceKindReference, referenceForModel, apiVersionForReference } from '../module/k8s';

const DropdownItem: React.SFC<DropdownItemProps> = ({model}) => <React.Fragment>
  <span className="co-type-selector__icon-wrapper">
    <ResourceIcon kind={model.kind} />
  </span>
  {model.kind}&nbsp;<span className="text-muted">({model.apiGroup}/{model.apiVersion})</span>
</React.Fragment>;

const ResourceListDropdown_: React.SFC<ResourceListDropdownProps> = props => {
  const { selected, onChange, allModels, showAll, className, preferredVersions } = props;

  const items = (allModels
    .filter(model => {
      const preferred = (m: K8sKind) => preferredVersions.some(v => v.groupVersion === apiVersionForReference(referenceForModel(m)));
      const sameGroupKind = (m: K8sKind) => m.kind === model.kind && m.apiGroup === model.apiGroup && m.apiVersion !== model.apiVersion;

      return !allModels.find(m => sameGroupKind(m) && preferred(m));
    })
    .sort((modelA, modelB) => modelA.kind > modelB.kind ? 1 : -1)
    .map((model) => <DropdownItem key={referenceForModel(model)} model={model} />) as ImmutableMap<string, JSX.Element>)
    .merge(showAll
      ? ImmutableMap({all: <React.Fragment>
        <span className="co-type-selector__icon-wrapper">
          <ResourceIcon kind="All" />
        </span>All Types
      </React.Fragment>})
      : ImmutableMap()
    )
    .toJS() as {[s: string]: JSX.Element};

  return <Dropdown className={classNames('co-type-selector', className)} items={items} title={items[selected]} onChange={onChange} selectedKey={selected} />;
};

const resourceListDropdownStateToProps = ({k8s}) => ({
  allModels: k8s.getIn(['RESOURCES', 'models']),
  preferredVersions: k8s.getIn(['RESOURCES', 'preferredVersions']),
});

export const ResourceListDropdown = connect(resourceListDropdownStateToProps)(ResourceListDropdown_);

ResourceListDropdown.propTypes = {
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.string,
  showAll: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
};

export type ResourceListDropdownProps = {
  // FIXME: `selected` should be GroupVersionKind
  selected: string;
  onChange: Function;
  allModels: ImmutableMap<K8sResourceKindReference, K8sKind>;
  preferredVersions: {groupVersion: string, version: string}[];
  className?: string;
  id?: string;
  showAll?: boolean;
};

type DropdownItemProps = {
  model: K8sKind;
};
