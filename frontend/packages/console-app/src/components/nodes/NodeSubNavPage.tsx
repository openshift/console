import type { ComponentType, FC } from 'react';
import { useMemo } from 'react';
import { useResolvedExtensions } from '@openshift/dynamic-plugin-sdk';
import { Bullseye, Flex, FlexItem, Spinner, Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { K8sResourceCommon, NodeKind, NodeSubNavTab } from '@console/dynamic-plugin-sdk/src';
import { isNodeSubNavTab } from '@console/dynamic-plugin-sdk/src';
import type { PageComponentProps } from '@console/internal/components/utils';
import { useTranslatedExtensions } from '@console/plugin-sdk/src/utils/useTranslatedExtensions';
import { useQueryParams } from '@console/shared/src/hooks/useQueryParams';
import { useQueryParamsMutator } from '@console/shared/src/hooks/useQueryParamsMutator';

export const CONFIG_PAGE_ID = 'configuration';
export const WORKLOADS_PAGE_ID = 'workloads';

export type SubPageType = {
  component: ComponentType<PageComponentProps<K8sResourceCommon>>;
  tabId: string;
  name?: string;
  nameKey?: string;
  priority: number;
};

type NodeSubNavPageProps = {
  obj: NodeKind;
  pageId: string;
  standardPages: SubPageType[];
};

export const NodeSubNavPage: FC<NodeSubNavPageProps> = ({ obj, pageId, standardPages }) => {
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const { setAllQueryArguments } = useQueryParamsMutator();
  const activeTabKey = queryParams.get('activeTab');

  const setActiveTabKey = (key: string) => {
    setAllQueryArguments({ activeTab: key });
  };

  const [subTabExtensions, extensionsResolved] = useResolvedExtensions<NodeSubNavTab>(
    isNodeSubNavTab,
  );
  const nodeSubTabExtensions = useTranslatedExtensions(subTabExtensions ?? []);

  const pages: SubPageType[] = useMemo(() => {
    if (!extensionsResolved) {
      return standardPages;
    }
    return [
      ...standardPages,
      ...nodeSubTabExtensions
        .filter((ext) => ext.properties.parentTab === pageId)
        .map((ext) => ({
          ...ext.properties.page,
          component: ext.properties.component,
        })),
    ].sort((a, b) => b.priority - a.priority);
  }, [pageId, standardPages, nodeSubTabExtensions, extensionsResolved]);

  const activePage = pages.find((page) => page.tabId === activeTabKey) ?? (pages[0] || null);
  const Component = activePage?.component;

  return (
    <Flex
      className="pf-v6-u-h-100 pf-v6-u-ml-md"
      flexWrap={{ default: 'nowrap' }}
      spaceItems={{ default: 'spaceItemsMd' }}
      alignItems={{ default: 'alignItemsFlexStart' }}
    >
      {!extensionsResolved ? (
        <FlexItem className="pf-v6-u-h-100" flex={{ default: 'flex_1' }}>
          <Bullseye>
            <Spinner />
          </Bullseye>
        </FlexItem>
      ) : (
        <>
          <FlexItem className="pf-v6-u-h-100">
            <Tabs
              className="pf-v6-u-pt-md"
              activeKey={activeTabKey || pages[0]?.tabId}
              component="nav"
              isVertical
              usePageInsets
              isSubtab
              onSelect={(_e, tabId) => {
                setActiveTabKey(String(tabId));
              }}
            >
              {pages.map(({ nameKey, name, tabId }) => {
                return (
                  <Tab
                    key={tabId}
                    eventKey={tabId}
                    data-test-id={`subnav-${tabId}`}
                    title={<TabTitleText>{nameKey ? t(nameKey) : name}</TabTitleText>}
                    aria-controls={undefined} // there is no corresponding tab content to control, so this ID is invalid
                  />
                );
              })}
            </Tabs>
          </FlexItem>
          {Component ? (
            <FlexItem flex={{ default: 'flex_1' }} className="pf-v6-u-h-100">
              <Component obj={obj} />
            </FlexItem>
          ) : null}
        </>
      )}
    </Flex>
  );
};
