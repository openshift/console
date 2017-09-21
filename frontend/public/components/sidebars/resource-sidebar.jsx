import * as React from 'react';

import * as closeBtnImg from '../../imgs/close-button.svg';
import { resourceSidebars } from './resource-sidebars';

export class ResourceSidebarWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showSidebar: true
    };
  }

  render() {
    const {style, label} = this.props;
    const {height} = style;
    const {showSidebar} = this.state;

    if (!showSidebar) {
      return <div className="co-p-cluster__sidebar--hidden pull-right hidden-xs">
        <button className="btn btn-link" onClick={() => this.setState({showSidebar: !showSidebar})}>
          <span className="fa fa-fw fa-info-circle co-p-cluster__sidebar-link-icon"></span>View samples
        </button>
      </div>;
    }

    return <div className="co-p-cluster__sidebar" style={{height}}>
      <div className="co-resource-sidebar co-m-pane__body">
        <div className="pull-right co-resource-sidebar__close-btn" onClick={() => this.setState({showSidebar: !showSidebar})}>
          <img src={closeBtnImg} className="co-resource-sidebar__close-btn"/>
        </div>
        <h1 className="co-p-cluster__sidebar-heading co-resource-sidebar-header text-capitalize">
          {label} samples
        </h1>
        { this.props.children }
      </div>
    </div>;
  }
}

export const ResourceSidebar = props => {
  const {kindObj, height} = props;
  const {kind, label} = kindObj;
  let SidebarComponent = resourceSidebars.get(kind);
  if (SidebarComponent) {
    return <ResourceSidebarWrapper label={label} style={{height: height}}>
      <SidebarComponent {...props} />
    </ResourceSidebarWrapper>;
  }
  return null;
};

