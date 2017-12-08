import * as _ from 'lodash';
import * as React from 'react';
import * as classNames from'classnames';
import { Tooltip } from 'react-lightweight-tooltip';
import { connect } from 'react-redux';

import { annotationsModal, configureReplicaCountModal, labelsModal, nodeSelectorModal, podSelectorModal, deleteModal } from '../modals';
import { DropdownMixin } from './dropdown';
import { history, resourceObjPath } from './index';
import { referenceForModel } from '../../module/k8s';
import { kindReducerName } from '../../kinds';

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

    let {options, size, anchor, isDisabled, id} = this.props;

    const shownOptions = _.reject(options, o => _.get(o, 'hidden', false));
    const lis = _.map(shownOptions, (o, i) => <li key={i}><a onClick={onClick_.bind({}, o)}>{o.label}</a></li>);
    const style = {display: this.state.active ? 'block' : 'none'};

    return (
      <div className={classNames('co-m-cog-wrapper', {'co-m-cog-wrapper--enabled': !isDisabled})} id={id}>
        { isDisabled ?
          <Tooltip content="disabled">
            <div ref={this.setNode} className={classNames('co-m-cog', `co-m-cog--anchor-${anchor || 'left'}`, {'co-m-cog--disabled' : isDisabled})} >
              <span className={classNames('co-m-cog', 'co-m-cog__icon', `co-m-cog__icon--size-${size || 'small'}`, 'fa', 'fa-cog', {'co-m-cog__icon--disabled' : isDisabled})}></span>
            </div>
          </Tooltip>
          : <div ref={this.setNode} onClick={this.toggle} className={classNames('co-m-cog', `co-m-cog--anchor-${anchor || 'left'}`, {'co-m-cog--disabled' : isDisabled})} >
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
    callback: () => deleteModal({
      kind: kind,
      resource: obj,
    }),
  }),
  Edit: (kind, obj) => ({
    label: `Edit ${kind.label}...`,
    href: `${resourceObjPath(obj, kind.crd ? referenceForModel(kind) : kind.kind)}/yaml`,
  }),
  ModifyLabels: (kind, obj) => ({
    label: 'Modify Labels...',
    callback: () => labelsModal({
      kind: kind,
      resource: obj,
    }),
  }),
  ModifyPodSelector: (kind, obj) => ({
    label: 'Modify Pod Selector...',
    callback: () => podSelectorModal({
      kind: kind,
      resource:  obj,
    }),
  }),
  ModifyNodeSelector: (kind, obj) => ({
    label: 'Modify Node Selector...',
    callback: () => nodeSelectorModal({
      kind: kind,
      resource: obj,
    }),
  }),
  ModifyAnnotations: (kind, obj) => ({
    label: 'Modify Annotations...',
    callback: () => annotationsModal({
      kind: kind,
      resource: obj,
    }),
  }),
  ModifyCount: (kind, obj) => ({
    label: 'Modify Count...',
    callback: () => configureReplicaCountModal({
      resourceKind: kind,
      resource: obj,
    }),
  }),
};

// The common menu actions that most resource share
Cog.factory.common = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const stateToProps = (state, {kind}) => ({
  kindObj: state[kindReducerName].get('kinds').find((v, k) => v.kind === kind || k === kind),
});

/** @type {React.StatelessComponent<{actions: any[], kind: string, resource: any, isDisabled?: boolean}>} */
export const ResourceCog = connect(stateToProps)(({actions, kindObj, resource, isDisabled}) => <Cog
  options={actions.map(a => a(kindObj, resource))}
  key={resource.metadata.uid}
  isDisabled={isDisabled !== undefined ? isDisabled : _.get(resource.metadata, 'deletionTimestamp')}
  id={`cog-for-${resource.metadata.uid}`}
/>);

ResourceCog.displayName = 'ResourceCog';
