import React from 'react';

import {inject} from './index';

const Box = ({children}) => <div className="cos-status-box">{children}</div>

const LoadError = ({label}) => <Box>
  <div className="cos-tristate--error">
    <div className="cos-text-center cos-error-title">Error Loading {label}</div>
    <div className="cos-text-center">Please try again.</div>
  </div>
</Box>

const Loading = () => <Box>
  <div className="co-m-loader co-an-fade-in-out">
    <div className="co-m-loader-dot__one"></div>
    <div className="co-m-loader-dot__two"></div>
    <div className="co-m-loader-dot__three"></div>
  </div>
</Box>

export const EmptyBox = ({label}) => <Box>
  <div className="cos-tristate-empty">
    <div className="cos-text-center">No {label} Found</div>
  </div>
</Box>

export const StatusBox = (props) => {
  const {loadError, loaded} = props;
  const label = props.label;

  if (loadError) {
    return <LoadError label={label} loadError={loadError} />;
  }

  if (!loaded) {
    return <Loading />
  }

  const {data, filters, selected} = props;

  if (!data || _.isEmpty(data)) {
    return <EmptyBox label={label} />;
  }

  let children;

  if (_.isArray(data)) {
    children = inject(props.children, {data, filters, selected});
  } else {
    children = inject(props.children, data);
  }

  if (children.length > 1) {
    return <div>{children}</div>;
  }
  return children[0];
}
