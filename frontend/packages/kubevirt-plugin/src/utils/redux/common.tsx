import * as React from 'react';

let lastID = 0;

const getNextReduxID = () => String(++lastID);

export const withReduxID = <T, _>(Component: React.ComponentType<T>) => {
  class IdComponent extends React.Component<T> {
    id = getNextReduxID();

    render() {
      return <Component reduxID={this.id} {...this.props} />;
    }
  }

  return IdComponent;
};
