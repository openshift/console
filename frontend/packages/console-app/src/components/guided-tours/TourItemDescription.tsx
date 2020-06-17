import * as React from 'react';
import './TourItemDescription.scss';

type TourItemDescriptionProps = {
  description: string;
  prerequisites: string[];
};
const TourItemDescription: React.FC<TourItemDescriptionProps> = ({
  description,
  prerequisites,
}) => (
  <>
    <div className="odc-tour-item-description--section">{description}</div>
    <div className="odc-tour-item-description--section">
      <h5>Prerequisites</h5>
      {prerequisites.map((prerequisite) => (
        <div>{prerequisite}</div>
      ))}
    </div>
  </>
);
export default TourItemDescription;
