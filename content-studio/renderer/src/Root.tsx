import React from 'react';
import { Composition } from 'remotion';
import { ShortVideo } from './ShortVideo';
import { Props } from './types';
import sampleSpec from '../examples/spec.example.json';
import sampleTheme from '../examples/theme.example.json';

// One generic composition. Real specs/themes are passed in by render.mjs (inputProps).
export const Root: React.FC = () => (
  <Composition
    id="ShortVideo"
    component={ShortVideo}
    defaultProps={{ spec: sampleSpec, theme: sampleTheme } as unknown as Props}
    calculateMetadata={({ props }) => {
      const p = props as Props;
      const fps = p.spec.fps;
      const frames = p.spec.scenes.reduce((n, s) => n + Math.round(s.durationSec * fps), 0);
      return { durationInFrames: frames, fps, width: p.spec.width, height: p.spec.height };
    }}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
  />
);
