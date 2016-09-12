import React from 'react';
import classNames from 'classnames';
import {angulars} from '../react-wrapper';
import {ResourceIcon} from './index';

const showYAML = (object) => {
  angulars.modal('show-yaml', {
    obj: object
  })();
}

const Yaml = (props) => <span className="pull-right co-m-page-title__obj">
  <a className="co-m-primary-action text-small" onClick={() => showYAML(props)}>
    <span className="fa fa-terminal tec-right-nav-action__mark"></span> View YAML
  </a>
</span>

export const NavTitle = (props) => <div className={classNames('row', {'co-m-nav-title__detail': props.detail}, {'co-m-nav-title': !props.detail})}>
  <div className="col-xs-12">
    <h1 className={classNames('co-m-page-title', {'co-m-page-title--detail': props.detail})}>
      {props.kind && <ResourceIcon kind={props.kind} className="co-m-page-title__icon"></ResourceIcon>}
      <span>{props.title}</span>
      {props.loaded && Yaml(props.data)}
    </h1>
  </div>
</div>
