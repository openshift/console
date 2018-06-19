import * as React from 'react';

import { CopyToClipboard as CTC } from 'react-copy-to-clipboard';

export const CopyToClipboard = ({value, visibleValue = value}) => <React.Fragment>
  <div className="co-copy-to-clipboard">
    <pre className="co-pre-wrap co-copy-to-clipboard__text">{visibleValue}</pre>
    <CTC text={value}>
      <button className="btn btn-default co-copy-to-clipboard__btn" type="button">
        <i className="fa fa-clipboard" aria-hidden="true"></i>
        <span className="sr-only">Copy to Clipboard</span>
      </button>
    </CTC>
  </div>
</React.Fragment>;
