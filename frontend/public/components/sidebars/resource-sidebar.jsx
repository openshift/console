import * as React from 'react';
import * as _ from 'lodash-es';
import { Button } from '@patternfly/react-core';
import { CloseIcon, InfoCircleIcon } from '@patternfly/react-icons';

import {
  ResourceSidebarSnippets,
  ResourceSidebarSamples,
  getResourceSidebarSamples,
} from './resource-sidebar-samples';
import { ExploreType } from './explore-type-sidebar';
import { Firehose, SimpleTabNav } from '../utils';
import { connectToFlags } from '../../reducers/features';
import { FLAGS } from '../../const';
import { referenceForModel } from '../../module/k8s';
import { ConsoleYAMLSampleModel } from '../../models';

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
    this.setState(
      (state) => {
        return { showSidebar: !state.showSidebar };
      },
      () => window.dispatchEvent(new Event('sidebar_toggle')),
    );
  }

  render() {
    const { style, label, linkLabel, children } = this.props;
    const { height } = style;
    const { showSidebar } = this.state;

    if (!showSidebar) {
      return (
        <div className="co-p-has-sidebar__sidebar--hidden hidden-sm hidden-xs">
          <Button type="button" variant="link" isInline onClick={this.toggleSidebar}>
            <InfoCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />
            {linkLabel}
          </Button>
        </div>
      );
    }

    return (
      <div
        className="co-p-has-sidebar__sidebar co-p-has-sidebar__sidebar--bordered hidden-sm hidden-xs"
        style={{ height }}
      >
        <div className="co-m-pane__body">
          <Button
            type="button"
            className="co-p-has-sidebar__sidebar-close"
            variant="plain"
            aria-label="Close"
            onClick={this.toggleSidebar}
          >
            <CloseIcon />
          </Button>
          <h2 className="co-p-has-sidebar__sidebar-heading text-capitalize">{label}</h2>
          {children}
        </div>
      </div>
    );
  }
}

const ResourceSchema = ({ kindObj }) => (
  <ExploreType kindObj={kindObj} scrollTop={sidebarScrollTop} />
);

const ResourceSamples = ({ samples, kindObj, downloadSampleYaml, loadSampleYaml }) => (
  <ResourceSidebarSamples
    samples={samples}
    kindObj={kindObj}
    downloadSampleYaml={downloadSampleYaml}
    loadSampleYaml={loadSampleYaml}
  />
);

const ResourceSnippets = ({ snippets, kindObj, insertSnippetYaml }) => (
  <ResourceSidebarSnippets
    snippets={snippets}
    kindObj={kindObj}
    insertSnippetYaml={insertSnippetYaml}
  />
);

const ResourceSidebarContent = (props) => {
  const {
    downloadSampleYaml,
    height,
    isCreateMode,
    kindObj,
    loadSampleYaml,
    insertSnippetYaml,
    yamlSamplesList,
  } = props;
  if (!kindObj) {
    return null;
  }

  const { label } = kindObj;
  const { samples, snippets } = getResourceSidebarSamples(kindObj, yamlSamplesList);
  const showSamples = !_.isEmpty(samples) && isCreateMode;
  const showSnippets = snippets.length > 0;

  let tabs = [];
  if (showSamples) {
    tabs.push({
      name: 'Samples',
      component: ResourceSamples,
    });
  }
  if (showSnippets) {
    tabs.push({
      name: 'Snippets',
      component: ResourceSnippets,
    });
  }
  if (tabs.length > 0) {
    // TODO: Pre-determine if we have a schema
    // Possible Related Bug: https://jira.coreos.com/browse/CONSOLE-1611
    tabs = [
      {
        name: 'Schema',
        component: ResourceSchema,
      },
      ...tabs,
    ];
  }

  return (
    <ResourceSidebarWrapper
      label={label}
      linkLabel={`View Schema ${showSamples ? 'and Samples' : ''}`}
      style={{ height }}
      startHidden={!isCreateMode}
    >
      {tabs.length > 0 ? (
        <SimpleTabNav
          tabs={tabs}
          tabProps={{
            downloadSampleYaml,
            kindObj,
            loadSampleYaml,
            insertSnippetYaml,
            samples,
            snippets,
          }}
          additionalClassNames="co-m-horizontal-nav__menu--within-sidebar"
        />
      ) : (
        <ResourceSchema kindObj={kindObj} />
      )}
    </ResourceSidebarWrapper>
  );
};

export const ResourceSidebar = connectToFlags(FLAGS.CONSOLE_YAML_SAMPLE)(({ flags, ...props }) => {
  const resources =
    flags[FLAGS.CONSOLE_YAML_SAMPLE] && props.isCreateMode
      ? [
          {
            kind: referenceForModel(ConsoleYAMLSampleModel),
            isList: true,
            prop: 'yamlSamplesList',
          },
        ]
      : [];

  return (
    <Firehose resources={resources}>
      <ResourceSidebarContent {...props} />
    </Firehose>
  );
});
