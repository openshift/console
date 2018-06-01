import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { Tooltip } from './tooltip';
import * as PropTypes from 'prop-types';

import { annotationsModal, configureReplicaCountModal, labelsModal, nodeSelectorModal, podSelectorModal, deleteModal } from '../modals';
import { DropdownMixin } from './dropdown';
import { history, resourceObjPath } from './index';
import { referenceForModel, kindForReference } from '../../module/k8s';
import { kindReducerName } from '../../kinds';
import store from '../../redux';


const CogItems = ({options, onClick}) => {
  const visibleOptions = _.reject(options, o => _.get(o, 'hidden', false));
  const lis = _.map(visibleOptions, (o, i) => <li key={i}><a onClick={e => onClick(e, o)}>{o.label}</a></li>);
  return <ul className="dropdown-menu co-m-cog__dropdown">
    {lis}
  </ul>;
};


export class Cog extends DropdownMixin {
  constructor(props) {
    super(props);
    this.onClick = (...args) => this.onClick_(...args);
  }

  componentWillReceiveProps () {
    // Stop call to parent for better performance
    return;
  }

  calculateOptions () {
    const {actions, kind, options, resource} = this.props;
    if (options) {
      return options;
    }
    // Latest possible binding to the Store for better mounting times
    //  NOTE: binding and passing this function in from ResourceCog resulted in ~25% worse performance when mounting, hence the crazy interface

    // TODO: (kans) maybe only do this when we are toggle to open state if scrolling performance is bad when cogs are open
    const kindState = store.getState()[kindReducerName];
    const kindObj = kindState.getIn(['kinds', kind]) || kindState.getIn(['kinds', kindForReference(kind)]);

    return kindObj ? _.map(actions, o => o(kindObj, resource)) : [];
  }

  onClick_ (event, option) {
    event.preventDefault();

    if (option.callback) {
      option.callback();
    }

    if (option.href) {
      history.push(option.href);
    }

    this.hide();
  }

  render () {
    const {anchor, isDisabled, id} = this.props;

    return (
      <div className={classNames('co-m-cog-wrapper', {'co-m-cog-wrapper--enabled': !isDisabled})} id={id}>
        { isDisabled ?
          <Tooltip content="disabled">
            <div ref={this.dropdownElement} className={classNames('co-m-cog', `co-m-cog--anchor-${anchor || 'left'}`, {'co-m-cog--disabled' : isDisabled})} >
              <span className={classNames('co-m-cog', 'co-m-cog__icon', 'fa', 'fa-cog', {'co-m-cog__icon--disabled' : isDisabled})}></span>
            </div>
          </Tooltip> :
          <div ref={this.dropdownElement} onClick={this.toggle} className={classNames('co-m-cog', `co-m-cog--anchor-${anchor || 'left'}`, {'co-m-cog--disabled' : isDisabled})} >
            <span className={classNames('co-m-cog', 'co-m-cog__icon', 'fa', 'fa-cog', {'co-m-cog__icon--disabled' : isDisabled})}></span>
            { this.state.active && <CogItems options={this.calculateOptions()} onClick={this.onClick} /> }
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
  EditEnvironment: (kind, obj) => ({
    label: `${kind.kind === 'Pod' ? 'View' : 'Edit'} Environment...`,
    href: `${resourceObjPath(obj, kind.crd ? referenceForModel(kind) : kind.kind)}/environment`,
  }),
};

// The common menu actions that most resource share
Cog.factory.common = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

/** @type {React.SFC<{actions: any[], kind: string, resource: any, isDisabled?: boolean}>} */
export const ResourceCog = ({actions, kind, resource, isDisabled}) => <Cog
  actions={actions}
  kind={kind}
  resource={resource}
  key={resource.metadata.uid}
  isDisabled={isDisabled !== undefined ? isDisabled : _.get(resource.metadata, 'deletionTimestamp')}
  id={`cog-for-${resource.metadata.uid}`}
/>;

ResourceCog.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.func).isRequired,
  kind: PropTypes.string.isRequired,
  resource: PropTypes.object.isRequired,
  isDisabled: PropTypes.bool,
};

ResourceCog.displayName = 'ResourceCog';
