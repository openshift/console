import React from 'react';

export const RadioInput = (props) => {
  const inputProps = _.omit(props, ['title', 'desc', 'children']);
  return <div>
    <label>
      <input type="radio" {...inputProps} />
      {props.title}
    </label>
    {props.desc && <p className="co-m-radio-desc text-muted">{props.desc}</p>}
    {props.children}
  </div>;
};
RadioInput.propTypes = {
  children: React.PropTypes.node,
  desc: React.PropTypes.node,
  title: React.PropTypes.node.isRequired,
};
