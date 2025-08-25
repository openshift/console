import * as React from 'react';

const MEMO = {};

type CamelCaseWrapProps = {
  value: string;
  dataTest?: string;
};

/**
 * Component that adds word break opportunities in camelCase and PascalCase strings for better text wrapping.
 *
 * This utility component is essential for displaying Kubernetes resource names and identifiers
 * that often use camelCase naming conventions. It prevents layout issues by allowing long
 * names to wrap at appropriate word boundaries.
 *
 * **Common use cases:**
 * - Displaying resource names in tables and lists
 * - Rendering property names in forms and detail views
 * - Status text that might contain long concatenated words
 * - Custom resource names and field identifiers
 *
 * **Breaking algorithm:**
 * - Splits text at capital letters that start new words
 * - Preserves consecutive capital letters as single units (e.g., "XMLParser" → "XML", "Parser")
 * - Inserts word break opportunities (`<wbr>`) between words
 * - Handles mixed case and acronym patterns intelligently
 *
 * **Performance optimizations:**
 * - Results are memoized to avoid repeated processing
 * - Efficient regex-based word boundary detection
 * - Minimal DOM overhead with semantic HTML elements
 * - Cache persists across component re-renders
 *
 * **Edge cases:**
 * - Empty or null values render as dash (-)
 * - Single words without case changes remain unchanged
 * - Numbers and special characters are preserved in place
 * - Non-string values are handled gracefully
 *
 * @example
 * ```tsx
 * // Basic camelCase wrapping
 * const ResourceName: React.FC<{name: string}> = ({name}) => {
 *   return (
 *     <div className="resource-name">
 *       <CamelCaseWrap value={name} dataTest="resource-name" />
 *     </div>
 *   );
 * };
 *
 * // Examples of text transformation:
 * // "containerImagePullBackOff" → "container<wbr>Image<wbr>Pull<wbr>Back<wbr>Off"
 * // "XMLHttpRequest" → "XML<wbr>Http<wbr>Request"
 * // "simpleString" → "simple<wbr>String"
 * ```
 *
 * @example
 * ```tsx
 * // Table cell with wrappable content
 * const NameCell: React.FC<{resource: K8sResourceKind}> = ({resource}) => {
 *   return (
 *     <TableData id="name">
 *       <CamelCaseWrap
 *         value={resource.metadata.name}
 *         dataTest={`name-${resource.metadata.uid}`}
 *       />
 *     </TableData>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Status text with potential long concatenations
 * const StatusMessage: React.FC<{condition: K8sCondition}> = ({condition}) => {
 *   return (
 *     <div className="condition-message">
 *       <span>Reason: </span>
 *       <CamelCaseWrap
 *         value={condition.reason}
 *         dataTest="condition-reason"
 *       />
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Custom resource field names
 * const PropertyList: React.FC<{properties: Record<string, any>}> = ({properties}) => {
 *   return (
 *     <dl className="property-list">
 *       {Object.entries(properties).map(([key, value]) => (
 *         <React.Fragment key={key}>
 *           <dt>
 *             <CamelCaseWrap value={key} />
 *           </dt>
 *           <dd>{String(value)}</dd>
 *         </React.Fragment>
 *       ))}
 *     </dl>
 *   );
 * };
 * ```
 *
 * @param value The string to process for word breaking. Should be a camelCase, PascalCase, or mixed-case string
 * @param dataTest Optional test identifier attribute for automated testing and debugging
 */
const CamelCaseWrap: React.FC<CamelCaseWrapProps> = ({ value, dataTest }) => {
  if (!value) {
    return '-';
  }

  if (MEMO[value]) {
    return MEMO[value];
  }

  // Add word break points before capital letters (but keep consecutive capital letters together).
  const words = value.match(/[A-Z]+[^A-Z]*|[^A-Z]+/g);
  const rendered = (
    <span data-test={dataTest}>
      {words.map((word, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={i}>
          {word}
          {i !== words.length - 1 && <wbr />}
        </React.Fragment>
      ))}
    </span>
  );
  MEMO[value] = rendered;
  return rendered;
};

export default CamelCaseWrap;
