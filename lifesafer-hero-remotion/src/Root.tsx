import React from 'react';
import {Composition, Folder} from 'remotion';
import {GuardianLocalTrust, VariantA, VariantB, VariantC} from './Variants';

const fps = 30;
const durationInFrames = 301;
const width = 1920;
const height = 1080;

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="LifeSafer-Hero">
      <Composition
        id="VariantA"
        component={VariantA}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
      />
      <Composition
        id="VariantB"
        component={VariantB}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
      />
      <Composition
        id="VariantC"
        component={VariantC}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
      />
      <Composition
        id="GuardianLocalTrust"
        component={GuardianLocalTrust}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
      />
    </Folder>
  );
};
