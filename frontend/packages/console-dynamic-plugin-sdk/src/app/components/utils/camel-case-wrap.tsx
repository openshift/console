import * as React from 'react';

const MEMO = {};

const CamelCaseWrap: React.FC<CamelCaseWrapProps> = ({ value, dataTest, ...props }) => {
  if (!value) {
    return '-';
  }

  if (MEMO[value]) {
    return MEMO[value];
  }

  // Add word break points before capital letters (but keep consecutive capital letters together).
  const words = value.match(/[A-Z]+[^A-Z]*|[^A-Z]+/g);
  const rendered = (
    <span data-test={dataTest} {...props}>
      {words.map((word, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={i}>
          {word}
          {i !== words.length - 1 && <wbr />}
        </React.Fragment>
      ))}
    </span>
  );
  MEMO[value] = rendered;
  return rendered;
};

type CamelCaseWrapProps = React.HTMLProps<HTMLSpanElement> & {
  value: string;
  dataTest?: string;
};

export default CamelCaseWrap;
