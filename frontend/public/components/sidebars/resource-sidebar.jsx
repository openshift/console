import * as _ from 'lodash-es';
import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { CloseIcon } from '@patternfly/react-icons';

import { ResourceSidebarSnippets, ResourceSidebarSamples } from './resource-sidebar-samples';
import { ExploreType } from './explore-type-sidebar';
import { SimpleTabNav } from '../utils';

const sidebarScrollTop = () => {
  document.getElementsByClassName('co-p-has-sidebar__sidebar')[0].scrollTop = 0;
};

class ResourceSidebarWrapper extends React.Component {
  render() {
    const { label, children, showSidebar, toggleSidebar } = this.props;

    if (!showSidebar) {
      return null;
    }

    return (
      <div className="co-p-has-sidebar__sidebar co-p-has-sidebar__sidebar--bordered hidden-sm hidden-xs">
        <div className="co-m-pane__body co-p-has-sidebar__sidebar-body">
          <Button
            type="button"
            className="co-p-has-sidebar__sidebar-close"
            variant="plain"
            aria-label="Close"
            onClick={toggleSidebar}
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

export const ResourceSidebar = (props) => {
  const {
    downloadSampleYaml,
    kindObj,
    loadSampleYaml,
    insertSnippetYaml,
    isCreateMode,
    toggleSidebar,
    showSidebar,
    samples,
    snippets,
    showSchema,
  } = props;
  if (!kindObj) {
    return null;
  }

  const { label } = kindObj;

  const showSamples = !_.isEmpty(samples) && isCreateMode;
  const showSnippets = !_.isEmpty(snippets);

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
  if (showSchema) {
    tabs = [
      {
        name: 'Schema',
        component: ResourceSchema,
      },
      ...tabs,
    ];
  }

  return (
    <ResourceSidebarWrapper label={label} showSidebar={showSidebar} toggleSidebar={toggleSidebar}>
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
