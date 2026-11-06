import type { FC } from 'react';
import { Fragment } from 'react';

const CamelCaseWrap: FC<CamelCaseWrapProps> = ({ value, dataTest }) => {
  if (!value) {
    return '-';
  }

  // Add word break points before capital letters (but keep consecutive capital letters together).
  const words = value.match(/[A-Z]+[^A-Z]*|[^A-Z]+/g);
  return (
    <span data-test={dataTest}>
      {words.map((word, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Fragment key={i}>
          {word}
          {i !== words.length - 1 && <wbr />}
        </Fragment>
      ))}
    </span>
  );
};

type CamelCaseWrapProps = {
  value: string;
  dataTest?: string;
};

export default CamelCaseWrap;
