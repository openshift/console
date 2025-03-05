import * as React from 'react';

const HWContext = React.createContext({
  isBlur: false,
  isNameEmpty: false,
  isNameUsed: false,
});

export default HWContext;
