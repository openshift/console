import * as _ from 'lodash';
import type { FC } from 'react';
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
import { SimpleTabNav, Tab } from '../utils/simple-tab-nav';
import { Sample } from '@console/shared/src/utils/sample-utils';
import { Flex, FlexItem, Title } from '@patternfly/react-core';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

const sidebarScrollTop = () => {
  document.getElementsByClassName('co-p-has-sidebar__sidebar')[0].scrollTop = 0;
};

const ResourceSidebarWrapper: FC<{
  label: string;
  toggleSidebar: () => void;
}> = (props) => {
  const { t } = useTranslation();
  const { label, children, toggleSidebar } = props;

  return (
    <div
      className="co-p-has-sidebar__sidebar co-p-has-sidebar__sidebar--bordered pf-v6-u-display-none pf-v6-u-display-block-on-sm"
      data-test="resource-sidebar"
    >
      <PaneBody className="co-p-has-sidebar__sidebar-body">
        <Flex flexWrap={{ default: 'nowrap' }}>
          <FlexItem grow={{ default: 'grow' }}>
            <Title headingLevel="h2" className="pf-v6-u-text-break-word">
              {label}
            </Title>
          </FlexItem>
          <CloseButton ariaLabel={t('public~Close')} onClick={toggleSidebar} />
        </Flex>
        {children}
      </PaneBody>
    </div>
  );
};

const ResourceSchema: FC<{ kindObj: K8sKind; schema: any }> = ({ kindObj, schema }) => (
  <ExploreType kindObj={kindObj} schema={schema} scrollTop={sidebarScrollTop} />
);

const ResourceSamples: FC<{
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

const ResourceSnippets: FC<{
  snippets: Sample[];
  insertSnippetYaml(id: string, yaml: string, reference: string);
}> = ({ snippets, insertSnippetYaml }) => (
  <ResourceSidebarSnippets snippets={snippets} insertSnippetYaml={insertSnippetYaml} />
);

export const ResourceSidebar: FC<{
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
          withinSidebar
          noInset
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
        />
      ) : (
        <ResourceSchema schema={schema} kindObj={kindObj} />
      )}
    </ResourceSidebarWrapper>
  );
};
