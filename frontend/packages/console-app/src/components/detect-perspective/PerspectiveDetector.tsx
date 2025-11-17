import { FC, useEffect, useState } from 'react';
import { useLocation, createPath } from 'react-router-dom-v5-compat';
import { Perspective, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { usePerspectives } from '@console/shared/src';

type DetectorProps = {
  setActivePerspective: (perspective: string, next: string) => void;
  perspectiveExtensions: Perspective[];
  detectors: (
    | undefined
    | ResolvedExtension<Perspective>['properties']['usePerspectiveDetection']
  )[];
};

type PerspectiveDetectorProps = {
  setActivePerspective: (perspective: string, next: string) => void;
};

const Detector: FC<DetectorProps> = ({
  setActivePerspective,
  perspectiveExtensions,
  detectors,
}) => {
  const location = useLocation();
  let detectedPerspective: string | undefined;
  const defaultPerspective =
    perspectiveExtensions.find((p) => p.properties.default) || perspectiveExtensions[0];
  const detectionResults = detectors.map((detector) => detector?.());

  const detectionComplete = detectionResults.every((result, index) => {
    if (result) {
      const [enablePerspective, loading] = result;
      if (!detectedPerspective && !loading && enablePerspective) {
        detectedPerspective = perspectiveExtensions[index].properties.id;
      }
      return loading === false;
    }
    return true;
  });

  useEffect(() => {
    if (detectedPerspective) {
      setActivePerspective(detectedPerspective, createPath(location));
    } else if (defaultPerspective && (detectors.length < 1 || detectionComplete)) {
      // set default perspective if there are no detectors or none of the detections were successful
      setActivePerspective(defaultPerspective.properties.id, createPath(location));
    }
  }, [
    defaultPerspective,
    detectedPerspective,
    detectionComplete,
    detectors.length,
    location,
    setActivePerspective,
  ]);

  return null;
};

const PerspectiveDetector: FC<PerspectiveDetectorProps> = ({ setActivePerspective }) => {
  const perspectiveExtensions = usePerspectives();
  const [detectors, setDetectors] = useState<
    (undefined | ResolvedExtension<Perspective>['properties']['usePerspectiveDetection'])[]
  >();
  useEffect(() => {
    let resolveCount = 0;
    const resolvedDetectors: ResolvedExtension<
      Perspective
    >['properties']['usePerspectiveDetection'][] = [];
    perspectiveExtensions.forEach((p, i) => {
      if (p.properties.usePerspectiveDetection) {
        p.properties
          .usePerspectiveDetection()
          .then((detector) => {
            resolvedDetectors[i] = detector;
          })
          .finally(() => {
            resolveCount++;
            if (resolveCount === perspectiveExtensions.length) {
              setDetectors(resolvedDetectors);
            }
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error('Perspective detection failed', e);
          });
      } else {
        resolveCount++;
        if (resolveCount === perspectiveExtensions.length) {
          setDetectors(resolvedDetectors);
        }
      }
    });
  }, [perspectiveExtensions]);
  return Array.isArray(detectors) ? (
    <Detector
      setActivePerspective={setActivePerspective}
      perspectiveExtensions={perspectiveExtensions}
      detectors={detectors}
    />
  ) : null;
};

export default PerspectiveDetector;
