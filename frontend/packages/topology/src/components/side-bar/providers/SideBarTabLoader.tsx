import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import {
  DetailsTab,
  DetailsTabSection,
  isDetailsTab,
  isDetailsTabSection,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import { Tab } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared';

const HookResolver = ({ useValue, onValueResolved }) => {
  const value = useValue();
  React.useEffect(() => {
    onValueResolved(value);
    // eslint-disable-next-line
  }, [value]);
  return null;
};

const TabSection: React.FC = ({ children }) => <>{children}</>;

const SideBarTabLoader: React.FC<{
  element: GraphElement;
  children: (tabs: Tab[], loaded: boolean) => React.ReactElement;
}> = ({ element, children }) => {
  const tabExtensions = useExtensions<DetailsTab>(isDetailsTab);
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [resolvedTabSections, setResolvedTabSections] = React.useState<{
    [parentTab: string]: {
      id: string;
      insertBefore?: string | string[];
      insertAfter?: string | string[];
      section: React.Component;
    }[];
  }>({});
  const [tabSectionExtensions, resolved] = useResolvedExtensions<DetailsTabSection>(
    isDetailsTabSection,
  );
  const orderedTabs = React.useMemo<DetailsTab['properties'][]>(
    () =>
      orderExtensionBasedOnInsertBeforeAndAfter<DetailsTab['properties']>(
        tabExtensions.map(({ properties }) => properties),
      ),
    [tabExtensions],
  );
  const tabs = React.useMemo(
    () =>
      orderedTabs.reduce((acc, { id, label }) => {
        const tabSections = resolvedTabSections[id];
        if (!tabSections) return acc;
        const tabContent = orderExtensionBasedOnInsertBeforeAndAfter(
          tabSections,
        ).map(({ id: tsId, section }) => <TabSection key={tsId}>{section}</TabSection>);
        return [...acc, { name: label, component: () => <>{tabContent}</> }];
      }, []),
    [orderedTabs, resolvedTabSections],
  );
  return resolved ? (
    <>
      {!loaded &&
        tabSectionExtensions.map(
          ({ uid, properties: { section, tab, ...props } }, index, sourceArr) => {
            return (
              <HookResolver
                key={uid}
                useValue={() => section(element)}
                onValueResolved={(resolvedSection: React.Component) => {
                  if (resolvedSection) {
                    setResolvedTabSections((resTabSections) => ({
                      ...resTabSections,
                      ...(resTabSections[tab]
                        ? {
                            [tab]: [...resTabSections[tab], { ...props, section: resolvedSection }],
                          }
                        : { [tab]: [{ ...props, section: resolvedSection }] }),
                    }));
                  }
                  if (index === sourceArr.length - 1) setLoaded(true);
                }}
              />
            );
          },
        )}
      {children(tabs, loaded)}
    </>
  ) : null;
};

export default SideBarTabLoader;
