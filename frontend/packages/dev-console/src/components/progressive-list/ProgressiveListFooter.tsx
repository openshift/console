import * as React from 'react';
import { Button } from '@patternfly/react-core';

export interface ProgressiveListFooterProps {
  items: string[];
  text: string;
  onShowItem: (item: string) => void;
}

const ProgressiveListFooter: React.FC<ProgressiveListFooterProps> = ({
  text,
  items,
  onShowItem,
}) => {
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <div>
      {text}
      {items.map((opt, index) => {
        let preText = ' ';
        let postText = '';
        if (items.length - 1 === index) {
          preText = items.length !== 1 ? ' and ' : ' ';
          postText = '.';
        } else {
          postText = items.length - 2 !== index ? ',' : '';
        }
        return (
          <React.Fragment key={opt}>
            {preText}
            <Button variant="link" isInline onClick={() => onShowItem(opt)}>
              {opt}
            </Button>
            {postText}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressiveListFooter;
