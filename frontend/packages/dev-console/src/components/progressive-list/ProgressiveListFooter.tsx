import * as React from 'react';

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
            <button
              className="btn btn-link odc-progressive-list__button"
              type="button"
              onClick={() => onShowItem(opt)}
            >
              {opt}
            </button>
            {postText}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressiveListFooter;
