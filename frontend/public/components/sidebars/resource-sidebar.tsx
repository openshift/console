import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import CloseButton from '@console/shared/src/components/close-button';

import { definitionFor, K8sKind } from '../../module/k8s';
import {
  ResourceSidebarSnippets,
  ResourceSidebarSamples,
  LoadSampleYaml,
  DownloadSampleYaml,
} from './resource-sidebar-samples';
import { ExploreType } from './explore-type-sidebar';
import { SimpleTabNav, Tab } from '../utils';
import { Sample } from '@console/shared';

const sidebarScrollTop = () => {
  document.getElementsByClassName('co-p-has-sidebar__sidebar')[0].scrollTop = 0;
};

const ResourceSidebarWrapper: React.FC<{
  label: string;
  toggleSidebar: () => void;
}> = (props) => {
  const { label, children, toggleSidebar } = props;

  return (
    <div
      className="co-p-has-sidebar__sidebar co-p-has-sidebar__sidebar--bordered hidden-sm hidden-xs"
      data-test="resource-sidebar"
    >
      <div className="co-m-pane__body co-p-has-sidebar__sidebar-body">
        <CloseButton
          additionalClassName="co-close-button--float-right co-p-has-sidebar__close-button"
          onClick={toggleSidebar}
        />
        <h2 className="co-p-has-sidebar__sidebar-heading text-capitalize">{label}</h2>
        {children}
      </div>
    </div>
  );
};

const ResourceSchema: React.FC<{ kindObj: K8sKind; schema: any }> = ({ kindObj, schema }) => (
  <ExploreType kindObj={kindObj} schema={schema} scrollTop={sidebarScrollTop} />
);

const ResourceSamples: React.FC<{
  samples: Sample[];
  loadSampleYaml: LoadSampleYaml;
  downloadSampleYaml: DownloadSampleYaml;
  kindObj: K8sKind;
}> = ({ samples, kindObj, downloadSampleYaml, loadSampleYaml }) => (
  <ResourceSidebarSamples
    samples={samples}
    kindObj={kindObj}
    downloadSampleYaml={downloadSampleYaml}
    loadSampleYaml={loadSampleYaml}
  />
);

const ResourceSnippets: React.FC<{
  snippets: Sample[];
  insertSnippetYaml(id: string, yaml: string, reference: string);
}> = ({ snippets, insertSnippetYaml }) => (
  <ResourceSidebarSnippets snippets={snippets} insertSnippetYaml={insertSnippetYaml} />
);

export const ResourceSidebar: React.FC<{
  kindObj: K8sKind;
  downloadSampleYaml: DownloadSampleYaml;
  schema: any;
  sidebarLabel: string;
  loadSampleYaml: LoadSampleYaml;
  insertSnippetYaml: (id: string, yaml: string, reference: string) => void;
  toggleSidebar: () => void;
  samples: Sample[];
  snippets: Sample[];
}> = (props) => {
  const { t } = useTranslation();
  const {
    downloadSampleYaml,
    kindObj,
    schema,
    sidebarLabel,
    loadSampleYaml,
    insertSnippetYaml,
    toggleSidebar,
    samples,
    snippets,
  } = props;
  if (!kindObj && !schema) {
    return null;
  }

  const kindLabel = kindObj?.labelKey ? t(kindObj.labelKey) : kindObj?.label;
  const label = sidebarLabel ? sidebarLabel : kindLabel;

  const showSamples = !_.isEmpty(samples);
  const showSnippets = !_.isEmpty(snippets);

  const definition = kindObj ? definitionFor(kindObj) : { properties: [] };
  const showSchema = schema || (definition && !_.isEmpty(definition.properties));

  let tabs: Tab[] = [];
  if (showSamples) {
    tabs.push({
      name: t('public~Samples'),
      component: ResourceSamples,
    });
  }
  if (showSnippets) {
    tabs.push({
      name: t('public~Snippets'),
      component: ResourceSnippets,
    });
  }
  if (showSchema) {
    tabs = [
      {
        name: t('public~Schema'),
        component: ResourceSchema,
      },
      ...tabs,
    ];
  }

  return (
    <ResourceSidebarWrapper label={label} toggleSidebar={toggleSidebar}>
      {tabs.length > 0 ? (
        <SimpleTabNav
          tabs={tabs}
          tabProps={{
            downloadSampleYaml,
            kindObj,
            schema,
            loadSampleYaml,
            insertSnippetYaml,
            samples,
            snippets,
          }}
          additionalClassNames="co-m-horizontal-nav__menu--within-sidebar"
        />
      ) : (
        <ResourceSchema schema={schema} kindObj={kindObj} />
      )}
    </ResourceSidebarWrapper>
  );
};
