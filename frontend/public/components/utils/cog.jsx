import React from 'react';
import ReactTooltip from 'react-tooltip';
import classNames from 'classnames';

import {util} from '../../module/k8s/util';
import {angulars} from '../react-wrapper';
import {confirmModal, configureReplicaCountModal, labelsModal} from '../modals';
import {DropdownMixin} from './dropdown';
import {kindObj} from './index';

export class Cog extends DropdownMixin {
  componentDidMount () {
    super.componentDidMount();
    ReactTooltip.rebuild();
  }

  render () {
    const onClick_ = (option, event) => {
      event.preventDefault();

      if (option.callback) {
        option.callback();
      }

      if (option.href) {
        angulars.$location.url(option.href);
      }

      this.hide();
    };

    let {options, size, anchor, isDisabled} = this.props;

    const shownOptions = _.reject(options, o => _.get(o, 'hidden', false));
    const lis = _.map(shownOptions, (o, i) => <li key={i}><a onClick={onClick_.bind({}, o)}>{o.label}</a></li>);
    const style = {display: this.state.active ? 'block' : 'none'};

    return (
      <div className="co-m-cog-wrapper" data-tip="Object can’t be edited in this state" data-tip-disable={!isDisabled}>
        <div ref="dropdownElement" onClick={this.toggle} className={classNames('co-m-cog', `co-m-cog--anchor-${anchor || 'left'}`, {'co-m-cog--disabled' : isDisabled})} >
          <span className={classNames('co-m-cog', 'co-m-cog__icon', `co-m-cog__icon--size-${size || 'small'}`, 'fa', 'fa-cog', {'co-m-cog__icon--disabled' : isDisabled})}></span>
          <ul className="co-m-cog__dropdown co-m-dropdown--dark dropdown-menu" style={style}>
            {lis}
          </ul>
        </div>
      </div>
    );
  }
}

Cog.factory = {
  Delete: (kind, obj) => ({
    label: `Delete ${kind.label} ...`,
    callback: () => confirmModal({
      title: `Delete ${kind.label} `,
      message: `Are you sure you want to delete ${obj.metadata.name}?`,
      btnText: `Delete ${kind.label} `,
      executeFn: () => {
        const deletePromise = angulars.k8s[kind.plural].delete(obj);

        // If we are currently on the deleted resource's page, redirect to the resource list page
        const re = new RegExp(`/${obj.metadata.name}/.*$`);
        if (re.test(window.location.pathname)) {
          angulars.$location.url(window.location.pathname.replace(re, ''));
        }

        return deletePromise;
      },
    }),
  }),
  Edit: (kind, obj) => ({
    label: `Edit ${kind.label}...`,
    weight: 400,
    href: util.getEditLink(obj, kind),
  }),
  ModifyLabels: (kind, obj) => ({
    label: 'Modify Labels...',
    callback: () => labelsModal({
      kind: kind,
      resource: obj,
      labelSelector: false,
    }),
  }),
  ModifyPodSelector: (kind, obj) => ({
    label: 'Modify Pod Selector...',
    callback: () => labelsModal({
      kind: kind,
      resource:  obj,
      labelSelector: true,
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

export const ResourceCog = ({actions, kind, resource, isDisabled}) => <Cog
  options={actions.map(a => a(kindObj(kind), resource))}
  key={resource.metadata.uid}
  isDisabled={isDisabled}
/>;
