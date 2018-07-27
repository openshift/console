import * as React from 'react';

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
      return <div className="co-p-has-sidebar__sidebar--hidden hidden-sm">
        <button className="btn btn-link" onClick={() => this.setState({showSidebar: !showSidebar})}>
          <span className="fa fa-fw fa-info-circle co-p-has-sidebar__sidebar-link-icon"></span>View samples
        </button>
      </div>;
    }

    return <div className="co-p-has-sidebar__sidebar co-p-has-sidebar__sidebar--bordered hidden-sm" style={{height}}>
      <div className="co-m-pane__body">
        <button type="button" className="close" aria-hidden="true" aria-label="Close" onClick={() => this.setState({showSidebar: !showSidebar})}>
          <span className="pficon pficon-close"></span>
        </button>
        <h1 className="co-p-has-sidebar__sidebar-heading co-resource-sidebar-header text-capitalize">
          {label} samples
        </h1>
        { this.props.children }
      </div>
    </div>;
  }
}

export const ResourceSidebar = props => {
  const {kindObj, height} = props;
  if (!kindObj) {
    return null;
  }

  const {kind, label} = kindObj;
  let SidebarComponent = resourceSidebars.get(kind);
  if (SidebarComponent) {
    return <ResourceSidebarWrapper label={label} style={{height: height}}>
      <SidebarComponent {...props} />
    </ResourceSidebarWrapper>;
  }
  return null;
};
