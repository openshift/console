import React from 'react';
import ReactTooltip from 'react-tooltip';
import classNames from 'classnames';

import {util} from '../../module/k8s/util';
import {angulars} from '../react-wrapper';
import {confirmModal} from '../modals/confirm-modal';
import {DropdownMixin} from './dropdown';

export class Cog extends DropdownMixin {
  componentDidMount () {
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

    const lis = _.map(options, (o, i) => <li key={i}><a onClick={onClick_.bind({}, o)}>{o.label}</a></li>);
    const style = {display: this.state.active ? 'block' : 'none'};

    return (
      <div className="co-m-cog-wrapper" data-tip="Object can’t be edited in this state" data-tip-disable={!isDisabled}>
        <div ref="dropdownElement" onClick={this.show} className={classNames('co-m-cog', `co-m-cog--anchor-${anchor || 'left'}`, {'co-m-cog--disabled' : isDisabled})} >
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
      executeFn: () => angulars.k8s[kind.plural].delete(obj),
    }),
  }),
  Edit: (kind, obj) => ({
    label: `Edit ${kind.label}...`,
    weight: 400,
    href: util.getEditLink(obj, kind),
  }),
  ModifyLabels: (kind, obj) => ({
    label: 'Modify Labels...',
    callback: angulars.modal('configure-labels', {
      kind: kind,
      resource: () => obj,
    }),
  }),
  ModifyPodSelector: (kind, obj) => ({
    label: 'Modify Pod Selector...',
    weight: 200,
    callback: angulars.modal('configure-selector', {
      resourceKind: kind,
      selectorKind: angulars.kinds.POD,
      resource: () => obj,
      message: `${kind.labelPlural} ensure the configured number of pods matching this pod selector are healthy and running.`,
    }),
  }),
  ModifyCount: (kind, obj) => ({
    label: 'Modify Count...',
    weight: 100,
    callback: angulars.modal('configure-replica-count', {
      resourceKind: kind,
      resource: () => obj,
    }),
  }),
  ModifyJobParallelism: (kind, obj) => ({
    label: 'Modify Parallelism...',
    weight: 100,
    callback: angulars.modal('configure-job-parallelism', {
      resourceKind: kind,
      resource: () => obj,
    }),
  }),
};
