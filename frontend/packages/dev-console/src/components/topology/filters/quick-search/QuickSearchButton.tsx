import * as React from 'react';
import { Tooltip, Button } from '@patternfly/react-core';
import QuickSearchIcon from './QuickSearchIcon';
import './QuickSearchButton.scss';

const QuickSearchButton: React.FC = () => {
  const [isQuickSearchActive, setIsQuickSearchActive] = React.useState<boolean>(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { nodeName } = e.target as Element;
      if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault();
        setIsQuickSearchActive(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <Tooltip position="right" content="Add to project">
      <Button className="odc-quick-search-button" variant="plain" isActive={isQuickSearchActive}>
        <QuickSearchIcon />
      </Button>
    </Tooltip>
  );
};

export default QuickSearchButton;
