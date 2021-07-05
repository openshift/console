import * as React from 'react';

import './LogSnippet.scss';

type LogSnippetProps = {
  logSnippet?: string;
  message: string;
};

const LogSnippet: React.FC<LogSnippetProps> = ({ logSnippet, message }) => {
  return (
    <div className="ocs-log-snippet">
      <p className="ocs-log-snippet__status-message">{message}</p>
      {logSnippet && <pre className="ocs-log-snippet__log-snippet">{logSnippet}</pre>}
    </div>
  );
};

export default LogSnippet;
