export const dimensifyHeader = (header: any[], columnClasses: string[]) => {
  if (!header || !columnClasses || header.length !== columnClasses.length) {
    console.warn('wrong dimensions specified for header'); // eslint-disable-line no-console
    return header;
  }

  return header.map((column, idx) => ({
    ...column,
    props: {
      ...column.props,
      className: columnClasses[idx],
    },
  }));
};

type DimensionResolver = (isLast?: boolean) => string;

export const dimensifyRow = (columnClasses: any[]): DimensionResolver => {
  let index = 0;
  return (isLast = false) => {
    if (index >= columnClasses.length) {
      console.warn('wrong dimensions specified for row (too many columns)'); // eslint-disable-line no-console
      return null;
    }

    if (isLast && index !== columnClasses.length - 1) {
      console.warn('wrong dimensions specified for row (not enough columns)'); // eslint-disable-line no-console
    }
    return columnClasses[index++];
  };
};
