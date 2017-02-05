import React from 'react';
import ReactTooltip from 'react-tooltip';

// A *single* ReactTooltip component should exist on the page. This gets shared amongst all uses of data-tip="".
//
// To use the tooltip, add data-tip="" to the appropriate JSX (replacing the usual title=""), and
// in the class surrounding the JSX, add ReactTooltip.rebuild() to componentDidMount().
// An example can be found in deployment.jsx
export const GlobalTooltip = () => <ReactTooltip class="co-tooltip" place="bottom" effect="solid" />;
