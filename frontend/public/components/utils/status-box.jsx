import React from 'react';
const StatusBox = ({children}) => <div className="cos-status-box"> {children} </div>

const LoadError = ({label}) => <StatusBox>
  <div className="cos-tristate--error">
    <div className="cos-text-center cos-error-title">Error Loading {label}</div>
    <div className="cos-text-center">Please try again.</div>
  </div>
</StatusBox>

const Empty = ({label}) => <StatusBox>
  <div className="cos-tristate-empty">
    <div className="cos-text-center">No {label} Found</div>
  </div>
</StatusBox>

const Loading = () => <StatusBox>
  <div className="co-m-loader co-an-fade-in-out">
    <div className="co-m-loader-dot__one"></div>
    <div className="co-m-loader-dot__two"></div>
    <div className="co-m-loader-dot__three"></div>
  </div>
</StatusBox>

const withStatusBox = (Component) => (props) => {
  const {label, loadError, loaded} = props;

  if (loadError) {
    return <LoadError label={label} loadError={loadError} />;
  }

  if (!loaded) {
    return <Loading />
  }

  const object = props.data;

  if (!object || _.isEmpty(object)) {
    return <Empty label={label} />;
  }

  return <Component {...props} />;
};

withStatusBox.Empty = Empty;

export default withStatusBox;
