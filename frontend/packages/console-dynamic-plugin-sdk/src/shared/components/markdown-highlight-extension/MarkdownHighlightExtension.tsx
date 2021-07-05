import * as React from 'react';
import { Spotlight } from '../spotlight';

type MarkdownHighlightExtensionProps = {
  docContext: HTMLDocument;
  rootSelector: string;
};
const MarkdownHighlightExtension: React.FC<MarkdownHighlightExtensionProps> = ({
  docContext,
  rootSelector,
}) => {
  const [selector, setSelector] = React.useState<string>(null);
  React.useEffect(() => {
    const elements = docContext.querySelectorAll(`${rootSelector} [data-highlight]`);
    let timeoutId: NodeJS.Timeout;
    function startHighlight(e) {
      const highlightId = e.target.getAttribute('data-highlight');
      if (!highlightId) {
        return;
      }
      setSelector(null);
      timeoutId = setTimeout(() => {
        setSelector(`[data-quickstart-id="${highlightId}"]`);
      }, 0);
    }
    elements && elements.forEach((elm) => elm.addEventListener('click', startHighlight));
    return () => {
      clearTimeout(timeoutId);
      elements && elements.forEach((elm) => elm.removeEventListener('click', startHighlight));
    };
  }, [docContext, rootSelector]);
  if (!selector) {
    return null;
  }
  return <Spotlight selector={selector} interactive />;
};
export default MarkdownHighlightExtension;
