import * as React from 'react';
import * as ReactDOM from 'react-dom';

const copyStyles = (sourceDoc, targetDoc) => {
  Array.from(sourceDoc.styleSheets).forEach((styleSheet) => {
    if (styleSheet.cssRules) {
      const newStyleEl = sourceDoc.createElement('style');
      Array.from(styleSheet.cssRules).forEach((cssRule) => {
        newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
      });
      targetDoc?.head.appendChild(newStyleEl);
    } else if (styleSheet.href) {
      const newLinkEl = sourceDoc.createElement('link');
      newLinkEl.rel = 'stylesheet';
      newLinkEl.href = styleSheet.href;
      targetDoc?.head.appendChild(newLinkEl);
    }
  });
};

export const WindowPortal = ({
  title = 'Portal',
  width = 1024,
  height = 768,
  copyDocumentStyles = true,
  onWindowClose,
  onWindowCreateFail,
  children,
}) => {
  const [containerEl] = React.useState(document.createElement('div'));
  const externalWindow = React.useRef(null);

  React.useEffect(
    () => {
      externalWindow.current = window.open(
        '',
        '',
        `width=${width},height=${height},left=200,top=200`,
      );
      if (!externalWindow.current) {
        return onWindowCreateFail();
      }

      externalWindow.current?.document.title = title;
      copyDocumentStyles &&
        externalWindow.current &&
        copyStyles(document, externalWindow.current?.document);

      externalWindow.current?.document.body.appendChild(containerEl);
      externalWindow.current?.addEventListener('beforeunload', () => {
        onWindowClose();
      });
      return () => {
        externalWindow.current?.close();
        externalWindow.current = null;
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return ReactDOM.createPortal(children, containerEl);
};
