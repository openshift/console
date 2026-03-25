import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import type { DetailsResourceLink } from '@console/dynamic-plugin-sdk';
import { isDetailsResourceLink, useResolvedExtensions } from '@console/dynamic-plugin-sdk';

export const useDetailsResourceLink = (element: GraphElement): ReactNode => {
  const [resurceLinkExtension, resolved] = useResolvedExtensions<DetailsResourceLink>(
    isDetailsResourceLink,
  );
  const resourceLink = useMemo(() => {
    return resolved
      ? resurceLinkExtension
          .sort((a, b) => b.properties.priority - a.properties.priority)
          .find(({ properties: { link } }) => !!link(element))
          ?.properties?.link?.(element)
      : null;
  }, [resurceLinkExtension, resolved, element]);
  return resourceLink;
};
