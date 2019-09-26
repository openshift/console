import * as React from 'react';
import {
  CloseIcon,
  DownloadIcon,
  InfoCircleIcon,
  PasteIcon,
} from '@patternfly/react-icons';

import { resourceSidebars } from './resource-sidebars';
import { ExploreType } from './explore-type-sidebar';
import { SimpleTabNav } from '../utils';

const sidebarScrollTop = () => {
  document.getElementsByClassName('co-p-has-sidebar__sidebar')[0].scrollTop = 0;
};

class ResourceSidebarWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.state = {
      showSidebar: !props.startHidden,
    };
  }

  toggleSidebar() {
    this.setState(state => {
      return {showSidebar: !state.showSidebar};
    }, () => window.dispatchEvent(new Event('sidebar_toggle')));
  }

  render() {
    const {style, label, linkLabel, children} = this.props;
    const {height} = style;
    const {showSidebar} = this.state;

    if (!showSidebar) {
      return <div className="co-p-has-sidebar__sidebar--hidden hidden-sm hidden-xs">
        <button className="btn btn-link" onClick={this.toggleSidebar}>
          <InfoCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />{linkLabel}
        </button>
      </div>;
    }

    return <div className="co-p-has-sidebar__sidebar co-p-has-sidebar__sidebar--bordered hidden-sm hidden-xs" style={{height}}>
      <div className="co-m-pane__body">
        <button type="button" className="close" aria-label="Close" onClick={this.toggleSidebar}>
          <CloseIcon />
        </button>
        <h2 className="co-p-has-sidebar__sidebar-heading text-capitalize">
          {label}
        </h2>
        {children}
      </div>
    </div>;
  }
}

export const SampleYaml = ({sample, loadSampleYaml, downloadSampleYaml}) => {
  const {highlightText, header, subheader, img, details, templateName, kind} = sample;
  return <li className="co-resource-sidebar-item">
    <h5 className="co-resource-sidebar-item__header">
      <span className="text-uppercase">{highlightText}</span> {header} <span className="co-role-sidebar-subheader">{subheader}</span>
    </h5>
    {img && <img src={img} className="co-resource-sidebar-item__img" />}
    <p className="co-resource-sidebar-item__details">
      {details}
    </p>
    <button className="btn btn-link" onClick={() => loadSampleYaml(templateName, kind)}>
      <PasteIcon className="co-icon-space-r" />Try it
    </button>
    <button className="btn btn-link pull-right" onClick={() => downloadSampleYaml(templateName, kind)}>
      <DownloadIcon className="co-icon-space-r" />Download YAML
    </button>
  </li>;
};

const ResourceSchema = ({kindObj}) => <ExploreType kindObj={kindObj} scrollTop={sidebarScrollTop} />;

export const ResourceSidebar = props => {
  const {
    downloadSampleYaml,
    height,
    isCreateMode,
    kindObj,
    loadSampleYaml,
  } = props;
  if (!kindObj) {
    return null;
  }

  const {kind, label} = kindObj;
  const ResourceSamples = resourceSidebars.get(kind);
  const showSamples = ResourceSamples && isCreateMode;

  return <ResourceSidebarWrapper
    label={label}
    linkLabel={`View Schema ${showSamples ? 'and Samples' : ''}`}
    style={{height}}
    startHidden={!isCreateMode}
  >
    { showSamples
      ? <SimpleTabNav
        tabs={[
          {
            name: 'Schema',
            component: ResourceSchema,
          },
          {
            name: 'Samples',
            component: ResourceSamples,
          },
        ]}
        tabProps={{
          downloadSampleYaml,
          kindObj,
          loadSampleYaml,
        }}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar"
      />
      : <ResourceSchema kindObj={kindObj} /> }
  </ResourceSidebarWrapper>;
};
