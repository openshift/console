import * as React from 'react';

export const GlobalNotification = ({title, content}) => <div className="co-global-notification">
  <div className="co-global-notification__sidebar">
    <p className="co-global-notification__text">{title}</p>
  </div>
  <div className="co-global-notification__content">
    <p className="co-global-notification__text">{content}</p>
  </div>
</div>;
GlobalNotification.propTypes = {
  title: React.PropTypes.node,
  content: React.PropTypes.node
};
