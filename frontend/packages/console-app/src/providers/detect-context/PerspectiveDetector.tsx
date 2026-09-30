import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useLocation, createPath } from 'react-router';
import type { Perspective, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';

type DetectorProps = {
  setActivePerspective: (perspective: string, next: string) => void;
  perspectiveExtensions: Perspective[];
  detectors: (
    undefined | ResolvedExtension<Perspective>['properties']['usePerspectiveDetection']
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
  const defaultPerspective =
    perspectiveExtensions.find((p) => p.properties.default) || perspectiveExtensions[0];
  const detectionResults = detectors.map((detector) => (detector as any)?.());

  const detectedPerspectiveIndex = detectionResults.findIndex((result) => {
    if (result) {
      const [enablePerspective, loading] = result;
      return !loading && enablePerspective;
    }
    return false;
  });
  const detectedPerspective =
    detectedPerspectiveIndex !== -1
      ? perspectiveExtensions[detectedPerspectiveIndex].properties.id
      : undefined;

  const detectionComplete = detectionResults.every((result) => {
    if (result) {
      const [, loading] = result;
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
  const [detectors, setDetectors] =
    useState<
      (undefined | ResolvedExtension<Perspective>['properties']['usePerspectiveDetection'])[]
    >();
  useEffect(() => {
    let resolveCount = 0;
    const resolvedDetectors: ResolvedExtension<Perspective>['properties']['usePerspectiveDetection'][] =
      [];
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
