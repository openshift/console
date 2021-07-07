import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import {
  DetailsResourceLink,
  isDetailsResourceLink,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';

export const useDetailsResourceLink = (
  element: GraphElement,
): React.Component | null | undefined => {
  const [resurceLinkExtension, resolved] = useResolvedExtensions<DetailsResourceLink>(
    isDetailsResourceLink,
  );
  const resourceLink = React.useMemo(() => {
    return resolved
      ? resurceLinkExtension
          .sort((a, b) => a.properties.priority - b.properties.priority)
          .find(({ properties: { link } }) => !!link(element))
          .properties?.link?.(element)
      : null;
  }, [resurceLinkExtension, resolved, element]);
  return resourceLink;
};
