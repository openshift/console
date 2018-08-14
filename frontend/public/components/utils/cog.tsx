/* eslint-disable no-undef */

import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { Tooltip } from './tooltip';

import { annotationsModal, configureReplicaCountModal, labelsModal, podSelectorModal, deleteModal } from '../modals';
import { DropdownMixin } from './dropdown';
import { history, resourceObjPath } from './index';
import { referenceForModel, K8sResourceKind, K8sResourceKindReference, K8sKind } from '../../module/k8s';
import { connectToModel } from '../../kinds';

const CogItems: React.SFC<CogItemsProps> = ({options, onClick}) => {
  const visibleOptions = _.reject(options, o => _.get(o, 'hidden', false));
  const lis = _.map(visibleOptions, (o, i) => <li key={i}><a onClick={e => onClick(e, o)}>{o.label}</a></li>);
  return <ul className="dropdown-menu co-m-cog__dropdown">
    {lis}
  </ul>;
};

const cogFactory: CogFactory = {
  Delete: (kind, obj) => ({
    label: `Delete ${kind.label}`,
    callback: () => deleteModal({
      kind: kind,
      resource: obj,
    }),
  }),
  Edit: (kind, obj) => ({
    label: `Edit ${kind.label}`,
    href: `${resourceObjPath(obj, kind.crd ? referenceForModel(kind) : kind.kind)}/yaml`,
  }),
  ModifyLabels: (kind, obj) => ({
    label: 'Edit Labels',
    callback: () => labelsModal({
      kind: kind,
      resource: obj,
    }),
  }),
  ModifyPodSelector: (kind, obj) => ({
    label: 'Edit Pod Selector',
    callback: () => podSelectorModal({
      kind: kind,
      resource:  obj,
    }),
  }),
  ModifyAnnotations: (kind, obj) => ({
    label: 'Edit Annotations',
    callback: () => annotationsModal({
      kind: kind,
      resource: obj,
    }),
  }),
  ModifyCount: (kind, obj) => ({
    label: 'Edit Count',
    callback: () => configureReplicaCountModal({
      resourceKind: kind,
      resource: obj,
    }),
  }),
  EditEnvironment: (kind, obj) => ({
    label: `${kind.kind === 'Pod' ? 'View' : 'Edit'} Environment`,
    href: `${resourceObjPath(obj, kind.crd ? referenceForModel(kind) : kind.kind)}/environment`,
  }),
};

// The common menu actions that most resource share
cogFactory.common = [cogFactory.ModifyLabels, cogFactory.ModifyAnnotations, cogFactory.Edit, cogFactory.Delete];

export const ResourceCog = connectToModel((props: ResourceCogProps) => {
  const {actions, kindObj, resource, isDisabled} = props;

  if (!kindObj) {
    return null;
  }
  return <Cog
    options={actions.map(a => a(kindObj, resource))}
    key={resource.metadata.uid}
    isDisabled={isDisabled !== undefined ? isDisabled : _.get(resource.metadata, 'deletionTimestamp')}
    id={`cog-for-${resource.metadata.uid}`}
  />;
});

export class Cog extends DropdownMixin {
  static factory: CogFactory = cogFactory;
  private onClick = this.onClick_.bind(this);

  onClick_(event, option) {
    event.preventDefault();

    if (option.callback) {
      option.callback();
    }

    if (option.href) {
      history.push(option.href);
    }

    this.hide();
  }

  render() {
    const {options, isDisabled, id} = this.props;

    return <div className={classNames('co-m-cog-wrapper', {'co-m-cog-wrapper--enabled': !isDisabled})} id={id}>
      { isDisabled ?
        <Tooltip content="disabled">
          <div ref={this.dropdownElement} className={classNames('co-m-cog', {'co-m-cog--disabled' : isDisabled})} >
            <span className={classNames('fa', 'fa-cog', 'co-m-cog__icon', {'co-m-cog__icon--disabled' : isDisabled})} aria-hidden="true"></span>
            <span className="sr-only">Actions</span>
          </div>
        </Tooltip> :
        <div ref={this.dropdownElement} onClick={this.toggle} className={classNames('co-m-cog', {'co-m-cog--disabled' : isDisabled})} >
          <span className={classNames('fa', 'fa-cog', 'co-m-cog__icon', {'co-m-cog__icon--disabled' : isDisabled})} aria-hidden="true"></span>
          <span className="sr-only">Actions</span>
          { this.state.active && <CogItems options={options} onClick={this.onClick} /> }
        </div>
      }
    </div>;
  }
}

export type CogOption = {
  label: string;
  href?: string, callback?: () => any;
};
export type CogAction = (kind, obj: K8sResourceKind) => CogOption;

export type ResourceCogProps = {
  kindObj: K8sKind;
  actions: CogAction[];
  kind: K8sResourceKindReference;
  resource: K8sResourceKind;
  isDisabled?: boolean;
};

export type CogItemsProps = {
  options: CogOption[];
  onClick: (event: React.MouseEvent<{}>, option: CogOption) => void;
};

export type CogFactory = {[name: string]: CogAction} & {common?: CogAction[]};

CogItems.displayName = 'CogItems';
ResourceCog.displayName = 'ResourceCog';
