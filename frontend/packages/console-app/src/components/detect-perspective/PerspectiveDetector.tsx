import * as React from 'react';
import { useLocation } from 'react-router-dom';
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

const Detector: React.FC<DetectorProps> = ({
  setActivePerspective,
  perspectiveExtensions,
  detectors,
}) => {
  const { pathname } = useLocation() ?? {};
  let detectedPerspective: string | undefined;
  const defaultPerspective =
    perspectiveExtensions.find((p) => p.properties.default) || perspectiveExtensions[0];
  const detectionResults = detectors.map((detector) => (detector as any)?.());

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

  React.useEffect(() => {
    if (detectedPerspective) {
      setActivePerspective(detectedPerspective, pathname);
    } else if (defaultPerspective && (detectors.length < 1 || detectionComplete)) {
      // set default perspective if there are no detectors or none of the detections were successfull
      setActivePerspective(defaultPerspective.properties.id, pathname);
    }
  }, [
    defaultPerspective,
    detectedPerspective,
    detectionComplete,
    detectors.length,
    pathname,
    setActivePerspective,
  ]);

  return null;
};

const PerspectiveDetector: React.FC<PerspectiveDetectorProps> = ({ setActivePerspective }) => {
  const perspectiveExtensions = usePerspectives();
  const [detectors, setDetectors] = React.useState<
    (undefined | ResolvedExtension<Perspective>['properties']['usePerspectiveDetection'])[]
  >();
  React.useEffect(() => {
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
