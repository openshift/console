import * as React from 'react';

export const inject = (children, props) => {
  const safeProps = _.omit(props, ['children']);
  return React.Children.map(children, c => {
    if (!_.isObject(c)) {
      return c;
    }
    return React.cloneElement(c, safeProps);
  });
};

export const injectChild = (children, props) => {
  const onlyChild = React.Children.only(children);
  return React.cloneElement(onlyChild, props);
};
