import React from 'react';
import classNames from 'classnames';
import { Tooltip } from 'react-lightweight-tooltip';

import {k8s} from '../../module/k8s/k8s';
import {getNamespacedRoute} from '../../ui/ui-actions';
import { annotationsModal, confirmModal, configureReplicaCountModal, labelsModal, nodeSelectorModal, podSelectorModal } from '../modals';
import { DropdownMixin, sortActions } from './dropdown';
import { history, kindObj, resourceObjPath } from './index';

export class Cog extends DropdownMixin {
  render () {
    const onClick_ = (option, event) => {
      event.preventDefault();

      if (option.callback) {
        option.callback();
      }

      if (option.href) {
        history.push(option.href);
      }

      this.hide();
    };

    let {options, size, anchor, isDisabled} = this.props;

    const shownOptions = _.reject(options, o => _.get(o, 'hidden', false));
    const lis = _.map(shownOptions, (o, i) => <li key={i}><a onClick={onClick_.bind({}, o)}>{o.label}</a></li>);
    const style = {display: this.state.active ? 'block' : 'none'};

    return (
      <div className="co-m-cog-wrapper">
        { isDisabled ?
          <Tooltip content="disabled">
            <div ref="dropdownElement" className={classNames('co-m-cog', `co-m-cog--anchor-${anchor || 'left'}`, {'co-m-cog--disabled' : isDisabled})} >
              <span className={classNames('co-m-cog', 'co-m-cog__icon', `co-m-cog__icon--size-${size || 'small'}`, 'fa', 'fa-cog', {'co-m-cog__icon--disabled' : isDisabled})}></span>
            </div>
          </Tooltip>
          : <div ref="dropdownElement" onClick={this.toggle} className={classNames('co-m-cog', `co-m-cog--anchor-${anchor || 'left'}`, {'co-m-cog--disabled' : isDisabled})} >
            <span className={classNames('co-m-cog', 'co-m-cog__icon', `co-m-cog__icon--size-${size || 'small'}`, 'fa', 'fa-cog', {'co-m-cog__icon--disabled' : isDisabled})}></span>
            <ul className="co-m-cog__dropdown dropdown--dark dropdown-menu" style={style}>
              {lis}
            </ul>
          </div>
        }
      </div>
    );
  }
}

Cog.factory = {
  Delete: (kind, obj) => ({
    label: `Delete ${kind.label}...`,
    weight: 900,
    callback: () => confirmModal({
      title: `Delete ${kind.label}`,
      message: `Are you sure you want to delete ${obj.metadata.name}?`,
      btnText: `Delete ${kind.label}`,
      executeFn: () => {
        const deletePromise = k8s[kind.plural].delete(obj);
        deletePromise.then(() => {
          // If we are currently on the deleted resource's page, redirect to the resource list page
          const re = new RegExp(`/${obj.metadata.name}/.*$`);
          if (re.test(window.location.pathname)) {
            history.push(getNamespacedRoute(kind.path));
          }

        });

        return deletePromise;
      },
    }),
  }),
  Edit: (kind, obj) => ({
    label: `Edit ${kind.label}...`,
    weight: 800,
    href: `${resourceObjPath(obj, kind.kind)}/yaml`,
  }),
  ModifyLabels: (kind, obj) => ({
    label: 'Modify Labels...',
    weight: 200,
    callback: () => labelsModal({
      kind: kind,
      resource: obj,
    }),
  }),
  ModifyPodSelector: (kind, obj) => ({
    label: 'Modify Pod Selector...',
    weight: 300,
    callback: () => podSelectorModal({
      kind: kind,
      resource:  obj,
    }),
  }),
  ModifyNodeSelector: (kind, obj) => ({
    label: 'Modify Node Selector...',
    weight: 400,
    callback: () => nodeSelectorModal({
      kind: kind,
      resource: obj,
    }),
  }),
  ModifyAnnotations: (kind, obj) => ({
    label: 'Modify Annotations...',
    weight: 500,
    callback: () => annotationsModal({
      kind: kind,
      resource: obj,
    }),
  }),
  ModifyCount: (kind, obj) => ({
    label: 'Modify Count...',
    weight: 100,
    callback: () => configureReplicaCountModal({
      resourceKind: kind,
      resource: obj,
    }),
  }),
};

// The common menu actions that most resource share
Cog.factory.common = [Cog.factory.ModifyLabels, Cog.factory.Edit, Cog.factory.Delete, Cog.factory.ModifyAnnotations];

export const ResourceCog = ({actions, kind, resource, isDisabled}) => <Cog
  options={sortActions(actions.map(a => a(kindObj(kind), resource)))}
  key={resource.metadata.uid}
  isDisabled={isDisabled}
/>;
