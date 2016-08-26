import React from 'react';

export const inject = (children, props) => {
  return React.Children.map(children, c => {
    if (!_.isObject(c)) {
      return c;
    }
    return React.cloneElement(c, props);
  });
};
