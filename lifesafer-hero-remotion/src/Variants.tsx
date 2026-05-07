import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const navy = '#0b1e66';
const deepNavy = '#071340';
const lime = '#72bf44';
const electric = '#b6ff2e';
const cream = '#f4efe4';
const ink = '#111827';
const orange = '#d84215';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

const asset = (name: string) => staticFile(`lifesafer-hero/${name}`);

const fullText = {
  fontFamily: 'Inter, Geist, Arial, sans-serif',
  letterSpacing: 0,
};

const Wordmark: React.FC<{light?: boolean; y?: number; scale?: number; opacity?: number; providerLabel?: string}> = ({
  light = false,
  y = 0,
  scale = 1,
  opacity = 1,
  providerLabel = 'Authorized LifeSafer provider',
}) => {
  return (
    <div
      style={{
        ...fullText,
        position: 'absolute',
        top: 76 + y,
        left: 88,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        transform: `scale(${scale})`,
        transformOrigin: 'left center',
        opacity,
      }}
    >
      <Img
        src={asset('interlockgologo.png')}
        style={{width: 58, height: 58, objectFit: 'contain'}}
      />
      <div>
        <div
          style={{
            color: light ? '#fff' : ink,
            fontWeight: 900,
            fontSize: 39,
            lineHeight: 1,
          }}
        >
          InterlockGo <span style={{color: orange}}>NOCO</span>
        </div>
        <div
          style={{
            color: light ? 'rgba(255,255,255,0.72)' : '#465065',
            fontWeight: 700,
            fontSize: 15,
            marginTop: 8,
            textTransform: 'uppercase',
          }}
        >
          {providerLabel}
        </div>
      </div>
    </div>
  );
};

const LifeSaferLogo: React.FC<{x?: number; y?: number; width?: number; opacity?: number}> = ({
  x = 0,
  y = 0,
  width = 410,
  opacity = 1,
}) => {
  return (
    <Img
      src={asset('LifeSafer_image.png')}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        opacity,
        objectFit: 'contain',
      }}
    />
  );
};

const GuardianLogo: React.FC<{x?: number; y?: number; width?: number; opacity?: number}> = ({
  x = 0,
  y = 0,
  width = 410,
  opacity = 1,
}) => {
  return (
    <Img
      src={asset('guardianV2.png')}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        opacity,
        objectFit: 'contain',
      }}
    />
  );
};

const Pill: React.FC<{children: React.ReactNode; x: number; y: number; opacity: number; color?: string}> = ({
  children,
  x,
  y,
  opacity,
  color = electric,
}) => {
  return (
    <div
      style={{
        ...fullText,
        position: 'absolute',
        left: x,
        top: y,
        opacity,
        background: 'rgba(255,255,255,0.1)',
        border: `1px solid ${color}`,
        color: '#fff',
        borderRadius: 999,
        padding: '14px 22px',
        fontSize: 20,
        fontWeight: 800,
        boxShadow: `0 0 34px ${color}55`,
      }}
    >
      {children}
    </div>
  );
};

const Device: React.FC<{
  x: number;
  y: number;
  width: number;
  rotate?: number;
  opacity?: number;
  shadow?: boolean;
}> = ({x, y, width, rotate = 0, opacity = 1, shadow = true}) => {
  return (
    <Img
      src={asset('ls250.png')}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        opacity,
        transform: `rotate(${rotate}deg)`,
        transformOrigin: '50% 58%',
        filter: shadow
          ? 'drop-shadow(0 42px 56px rgba(0,0,0,0.48)) drop-shadow(0 0 24px rgba(182,255,46,0.18))'
          : undefined,
      }}
    />
  );
};

const GuardianDevice: React.FC<{
  x: number;
  y: number;
  width: number;
  rotate?: number;
  opacity?: number;
  shadow?: boolean;
}> = ({x, y, width, rotate = 0, opacity = 1, shadow = true}) => {
  return (
    <Img
      src={asset('guardianhandset.png')}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        opacity,
        transform: `rotate(${rotate}deg)`,
        transformOrigin: '50% 58%',
        filter: shadow
          ? 'drop-shadow(0 42px 56px rgba(0,0,0,0.5)) drop-shadow(0 0 24px rgba(220,38,38,0.22))'
          : undefined,
      }}
    />
  );
};

const ProgressBar: React.FC<{progress: number; light?: boolean}> = ({progress, light = true}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 88,
        right: 88,
        bottom: 70,
        height: 4,
        borderRadius: 999,
        background: light ? 'rgba(255,255,255,0.18)' : 'rgba(7,19,64,0.14)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress * 100}%`,
          borderRadius: 999,
          background: light ? `linear-gradient(90deg, ${lime}, ${electric})` : navy,
        }}
      />
    </div>
  );
};

const BackgroundGrid: React.FC<{opacity?: number}> = ({opacity = 0.18}) => {
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
        maskImage: 'radial-gradient(circle at 62% 46%, #000 0%, transparent 72%)',
      }}
    />
  );
};

export const VariantA: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const progress = frame / (durationInFrames - 1);

  const deviceScale = interpolate(frame, [0, 2.2 * fps, 8.8 * fps], [1.18, 0.7, 0.82], {
    ...clamp,
    easing: easeOut,
  });
  const deviceX = interpolate(frame, [0, 2.2 * fps, 8.8 * fps], [480, 1050, 925], {
    ...clamp,
    easing: easeOut,
  });
  const deviceY = interpolate(frame, [0, 2.2 * fps, 8.8 * fps], [-170, -58, -120], {
    ...clamp,
    easing: easeOut,
  });
  const headlineOpacity = interpolate(frame, [0.8 * fps, 1.7 * fps], [0, 1], clamp);
  const headlineY = interpolate(frame, [0.8 * fps, 1.7 * fps], [34, 0], {...clamp, easing: easeOut});
  const finalOpacity = interpolate(frame, [7.5 * fps, 8.5 * fps], [0, 1], clamp);
  const glow = interpolate(frame, [0, 2.4 * fps, 6 * fps, 10 * fps], [0.2, 1, 0.55, 1], clamp);
  const screenFlash = interpolate(frame, [1.1 * fps, 1.35 * fps, 1.7 * fps], [0, 1, 0], clamp);

  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 70% 45%, #1b326d 0%, ${deepNavy} 46%, #030712 100%)`}}>
      <BackgroundGrid />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${61 + Math.sin(t) * 4}% ${45 + Math.cos(t) * 3}%, rgba(182,255,46,${0.2 * glow}) 0%, transparent 30%)`,
        }}
      />
      <Wordmark light opacity={interpolate(frame, [0, fps], [0, 1], clamp)} />
      <LifeSaferLogo
        x={88}
        y={872}
        width={322}
        opacity={interpolate(frame, [1.2 * fps, 2 * fps], [0, 0.94], clamp)}
      />
      <Device x={deviceX} y={deviceY} width={760 * deviceScale} rotate={interpolate(frame, [0, 4 * fps], [-7, 0], clamp)} />
      <div
        style={{
          position: 'absolute',
          left: deviceX + 270 * deviceScale,
          top: deviceY + 244 * deviceScale,
          width: 196 * deviceScale,
          height: 122 * deviceScale,
          borderRadius: 16,
          background: `rgba(182,255,46,${screenFlash * 0.35})`,
          boxShadow: `0 0 ${80 * screenFlash}px rgba(182,255,46,0.85)`,
        }}
      />
      <div
        style={{
          ...fullText,
          position: 'absolute',
          left: 90,
          top: 276 + headlineY,
          width: 760,
          opacity: headlineOpacity,
        }}
      >
        <div style={{color: electric, fontSize: 22, fontWeight: 900, textTransform: 'uppercase'}}>
          LifeSafer launch system
        </div>
        <div style={{color: '#fff', fontSize: 104, fontWeight: 950, lineHeight: 0.92, marginTop: 24}}>
          Certified install.
          <br />
          Clean compliance.
        </div>
        <div style={{color: 'rgba(255,255,255,0.76)', fontSize: 29, fontWeight: 650, lineHeight: 1.35, marginTop: 34}}>
          Same-day ignition interlock setup in Evans and Greeley with a device clients can understand fast.
        </div>
      </div>
      <Pill x={90} y={812} opacity={interpolate(frame, [2.8 * fps, 3.4 * fps, 6.8 * fps, 7.4 * fps], [0, 1, 1, 0], clamp)}>
        Install
      </Pill>
      <Pill x={225} y={812} opacity={interpolate(frame, [3.3 * fps, 3.9 * fps, 6.8 * fps, 7.4 * fps], [0, 1, 1, 0], clamp)}>
        Calibrate
      </Pill>
      <Pill x={398} y={812} opacity={interpolate(frame, [3.8 * fps, 4.4 * fps, 6.8 * fps, 7.4 * fps], [0, 1, 1, 0], clamp)}>
        Report
      </Pill>
      <div
        style={{
          ...fullText,
          position: 'absolute',
          left: 88,
          top: 306,
          opacity: finalOpacity,
          color: '#fff',
        }}
      >
        <div style={{fontSize: 36, fontWeight: 900, color: electric}}>InterlockGo NOCO x LifeSafer</div>
        <div style={{fontSize: 86, fontWeight: 950, lineHeight: 0.94, marginTop: 22}}>
          Back on the road.
          <br />
          Right.
        </div>
        <div style={{fontSize: 27, marginTop: 30, color: 'rgba(255,255,255,0.74)', fontWeight: 650}}>
          3610 35th Avenue Unit 7 - Evans, Colorado
        </div>
      </div>
      <ProgressBar progress={progress} />
    </AbsoluteFill>
  );
};

export const VariantB: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const progress = frame / (durationInFrames - 1);

  const photoScale = interpolate(frame, [0, durationInFrames - 1], [1.08, 1.2], clamp);
  const photoX = interpolate(frame, [0, durationInFrames - 1], [-160, -360], clamp);
  const cardY = interpolate(frame, [0.7 * fps, 1.6 * fps], [42, 0], {...clamp, easing: easeOut});
  const deviceX = interpolate(frame, [2.4 * fps, 4.2 * fps, 8.4 * fps], [1510, 1128, 1100], {
    ...clamp,
    easing: easeOut,
  });
  const deviceOpacity = interpolate(frame, [2.2 * fps, 3 * fps], [0, 1], clamp);
  const routeProgress = interpolate(frame, [3 * fps, 5.6 * fps], [0, 1], clamp);
  const finalBadge = interpolate(frame, [7.7 * fps, 8.5 * fps], [0, 1], clamp);

  return (
    <AbsoluteFill style={{background: '#0a0f1f'}}>
      <Img
        src={asset('Interlockgo.jpeg')}
        style={{
          position: 'absolute',
          left: photoX,
          top: -140,
          width: 2280 * photoScale,
          height: 1280 * photoScale,
          objectFit: 'cover',
          filter: 'saturate(1.05) contrast(1.02)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(3,7,18,0.9) 0%, rgba(3,7,18,0.62) 36%, rgba(3,7,18,0.2) 68%, rgba(3,7,18,0.72) 100%)',
        }}
      />
      <Wordmark light y={-12} opacity={interpolate(frame, [0, fps], [0, 1], clamp)} />
      <div
        style={{
          ...fullText,
          position: 'absolute',
          left: 88,
          top: 258 + cardY,
          width: 760,
          color: '#fff',
          opacity: interpolate(frame, [0.7 * fps, 1.6 * fps], [0, 1], clamp),
        }}
      >
        <div style={{fontSize: 22, fontWeight: 950, textTransform: 'uppercase', color: electric}}>
          Local Evans service center
        </div>
        <div style={{fontSize: 96, fontWeight: 950, lineHeight: 0.93, marginTop: 22}}>
          The interlock shop clients can actually find.
        </div>
        <div style={{fontSize: 29, fontWeight: 700, lineHeight: 1.32, marginTop: 34, color: 'rgba(255,255,255,0.78)'}}>
          LifeSafer installation, calibration, and Colorado DMV reporting from 3610 35th Avenue Unit 7.
        </div>
      </div>
      <svg style={{position: 'absolute', inset: 0, overflow: 'visible'}} viewBox="0 0 1920 1080">
        <path
          d="M 642 774 C 820 650, 935 604, 1116 572 S 1445 504, 1626 345"
          fill="none"
          stroke="rgba(182,255,46,0.25)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 642 774 C 820 650, 935 604, 1116 572 S 1445 504, 1626 345"
          fill="none"
          stroke={electric}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${760 * routeProgress} 760`}
        />
      </svg>
      <div
        style={{
          ...fullText,
          position: 'absolute',
          left: 520,
          top: 788,
          padding: '18px 26px',
          borderRadius: 18,
          background: 'rgba(255,255,255,0.94)',
          color: deepNavy,
          fontSize: 28,
          fontWeight: 900,
          opacity: interpolate(frame, [3.4 * fps, 4.2 * fps], [0, 1], clamp),
          boxShadow: '0 22px 44px rgba(0,0,0,0.22)',
        }}
      >
        Evans - Greeley - Northern Colorado
      </div>
      <Device x={deviceX} y={145} width={520} rotate={-4} opacity={deviceOpacity} />
      <LifeSaferLogo x={1214} y={765} width={400} opacity={interpolate(frame, [5.4 * fps, 6.2 * fps], [0, 1], clamp)} />
      <div
        style={{
          ...fullText,
          position: 'absolute',
          right: 92,
          bottom: 118,
          opacity: finalBadge,
          color: '#fff',
          textAlign: 'right',
        }}
      >
        <div style={{fontSize: 24, fontWeight: 900, color: electric}}>Same-day appointments when available</div>
        <div style={{fontSize: 52, fontWeight: 950, marginTop: 10}}>970-515-5740</div>
      </div>
      <ProgressBar progress={progress} />
    </AbsoluteFill>
  );
};

export const GuardianLocalTrust: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const progress = frame / (durationInFrames - 1);
  const guardianRed = '#dc2626';
  const guardianRedLight = '#ef4444';
  const warmWhite = '#fff7ed';

  const photoScale = interpolate(frame, [0, durationInFrames - 1], [1.08, 1.2], clamp);
  const photoX = interpolate(frame, [0, durationInFrames - 1], [-160, -360], clamp);
  const cardY = interpolate(frame, [0.7 * fps, 1.6 * fps], [42, 0], {...clamp, easing: easeOut});
  const deviceX = interpolate(frame, [2.4 * fps, 4.2 * fps, 8.4 * fps], [1510, 1128, 1100], {
    ...clamp,
    easing: easeOut,
  });
  const deviceOpacity = interpolate(frame, [2.2 * fps, 3 * fps], [0, 1], clamp);
  const routeProgress = interpolate(frame, [3 * fps, 5.6 * fps], [0, 1], clamp);
  const finalBadge = interpolate(frame, [7.7 * fps, 8.5 * fps], [0, 1], clamp);

  return (
    <AbsoluteFill style={{background: '#120f0f'}}>
      <Img
        src={asset('Interlockgo.jpeg')}
        style={{
          position: 'absolute',
          left: photoX,
          top: -140,
          width: 2280 * photoScale,
          height: 1280 * photoScale,
          objectFit: 'cover',
          filter: 'saturate(0.96) contrast(1.08)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(15,10,10,0.9) 0%, rgba(15,10,10,0.62) 36%, rgba(15,10,10,0.18) 68%, rgba(15,10,10,0.72) 100%)',
        }}
      />
      <Wordmark
        light
        y={-12}
        opacity={interpolate(frame, [0, fps], [0, 1], clamp)}
        providerLabel="Authorized Guardian provider"
      />
      <div
        style={{
          ...fullText,
          position: 'absolute',
          left: 88,
          top: 258 + cardY,
          width: 760,
          color: warmWhite,
          opacity: interpolate(frame, [0.7 * fps, 1.6 * fps], [0, 1], clamp),
        }}
      >
        <div style={{fontSize: 22, fontWeight: 950, textTransform: 'uppercase', color: guardianRedLight}}>
          Guardian service in Evans
        </div>
        <div style={{fontSize: 96, fontWeight: 950, lineHeight: 0.93, marginTop: 22}}>
          AMS2500 support from a shop clients can find.
        </div>
        <div style={{fontSize: 29, fontWeight: 700, lineHeight: 1.32, marginTop: 34, color: 'rgba(255,247,237,0.78)'}}>
          Guardian ignition interlock installation, calibration, and Colorado DMV support from 3610 35th Avenue Unit 7.
        </div>
      </div>
      <svg style={{position: 'absolute', inset: 0, overflow: 'visible'}} viewBox="0 0 1920 1080">
        <path
          d="M 642 774 C 820 650, 935 604, 1116 572 S 1445 504, 1626 345"
          fill="none"
          stroke="rgba(239,68,68,0.22)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 642 774 C 820 650, 935 604, 1116 572 S 1445 504, 1626 345"
          fill="none"
          stroke={guardianRedLight}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${760 * routeProgress} 760`}
        />
      </svg>
      <div
        style={{
          ...fullText,
          position: 'absolute',
          left: 520,
          top: 788,
          padding: '18px 26px',
          borderRadius: 18,
          background: 'rgba(255,247,237,0.94)',
          color: '#17140f',
          fontSize: 28,
          fontWeight: 900,
          opacity: interpolate(frame, [3.4 * fps, 4.2 * fps], [0, 1], clamp),
          boxShadow: '0 22px 44px rgba(0,0,0,0.24)',
        }}
      >
        Evans - Greeley - Northern Colorado
      </div>
      <GuardianDevice x={deviceX} y={104} width={560} rotate={-4} opacity={deviceOpacity} />
      <GuardianLogo x={1232} y={752} width={390} opacity={interpolate(frame, [5.4 * fps, 6.2 * fps], [0, 1], clamp)} />
      <div
        style={{
          ...fullText,
          position: 'absolute',
          right: 92,
          bottom: 118,
          opacity: finalBadge,
          color: warmWhite,
          textAlign: 'right',
        }}
      >
        <div style={{fontSize: 24, fontWeight: 900, color: guardianRedLight}}>Same-day appointments when available</div>
        <div style={{fontSize: 52, fontWeight: 950, marginTop: 10}}>970-515-5740</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 88,
          right: 88,
          bottom: 70,
          height: 4,
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${guardianRed}, ${guardianRedLight})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const StepCard: React.FC<{
  index: string;
  title: string;
  detail: string;
  x: number;
  y: number;
  opacity: number;
  active: number;
}> = ({index, title, detail, x, y, opacity, active}) => {
  return (
    <div
      style={{
        ...fullText,
        position: 'absolute',
        left: x,
        top: y,
        width: 386,
        minHeight: 164,
        opacity,
        padding: '26px 28px',
        borderRadius: 26,
        background: `rgba(255,255,255,${0.94 + active * 0.04})`,
        border: `2px solid rgba(114,191,68,${0.18 + active * 0.62})`,
        boxShadow: `0 ${18 + active * 20}px ${36 + active * 22}px rgba(7,19,64,${0.13 + active * 0.12})`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: active > 0.5 ? lime : navy,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 950,
            fontSize: 20,
          }}
        >
          {index}
        </div>
        <div style={{fontSize: 29, lineHeight: 1, fontWeight: 950, color: deepNavy}}>{title}</div>
      </div>
      <div style={{fontSize: 18, lineHeight: 1.32, color: '#536079', marginTop: 20, fontWeight: 650}}>{detail}</div>
    </div>
  );
};

export const VariantC: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const progress = frame / (durationInFrames - 1);

  const deviceY = interpolate(frame, [0, 1.6 * fps, 7.7 * fps], [35, -18, -74], {...clamp, easing: easeOut});
  const deviceX = interpolate(frame, [0, 1.8 * fps, 7.7 * fps], [676, 642, 1062], {...clamp, easing: easeOut});
  const cardIn = (start: number) => interpolate(frame, [start * fps, (start + 0.65) * fps], [0, 1], {...clamp, easing: easeOut});
  const active = (start: number) => interpolate(frame, [(start - 0.2) * fps, start * fps, (start + 1.15) * fps], [0, 1, 0], clamp);
  const finalOpacity = interpolate(frame, [7.5 * fps, 8.4 * fps], [0, 1], clamp);

  return (
    <AbsoluteFill style={{background: `linear-gradient(135deg, ${cream} 0%, #ffffff 47%, #e6f2dc 100%)`}}>
      <AbsoluteFill
        style={{
          opacity: 0.55,
          backgroundImage:
            'radial-gradient(circle at 18% 25%, rgba(216,66,21,0.13) 0%, transparent 28%), radial-gradient(circle at 78% 42%, rgba(114,191,68,0.22) 0%, transparent 32%)',
        }}
      />
      <Wordmark opacity={interpolate(frame, [0, fps], [0, 1], clamp)} />
      <LifeSaferLogo x={1460} y={92} width={310} opacity={interpolate(frame, [0.3 * fps, 1.2 * fps], [0, 1], clamp)} />
      <div
        style={{
          ...fullText,
          position: 'absolute',
          left: 88,
          top: 252,
          width: 708,
          color: deepNavy,
          opacity: interpolate(frame, [0.5 * fps, 1.4 * fps, 7 * fps, 7.6 * fps], [0, 1, 1, 0], clamp),
        }}
      >
        <div style={{fontSize: 22, fontWeight: 950, color: lime, textTransform: 'uppercase'}}>
          Compliance sprint
        </div>
        <div style={{fontSize: 92, fontWeight: 950, lineHeight: 0.95, marginTop: 24}}>
          From required to ready.
        </div>
        <div style={{fontSize: 28, fontWeight: 700, color: '#526078', lineHeight: 1.34, marginTop: 32}}>
          A simple LifeSafer flow for drivers who need install, calibration, and reporting handled without confusion.
        </div>
      </div>
      <Device x={deviceX} y={deviceY} width={500} rotate={interpolate(frame, [0, 3 * fps], [3, -2], clamp)} />
      <StepCard
        index="1"
        title="Call"
        detail="Confirm device, vehicle, and timing."
        x={92}
        y={662}
        opacity={cardIn(1.8)}
        active={active(2.3)}
      />
      <StepCard
        index="2"
        title="Install"
        detail="Clean, certified LifeSafer setup."
        x={488}
        y={750}
        opacity={cardIn(2.8)}
        active={active(3.3)}
      />
      <StepCard
        index="3"
        title="Report"
        detail="Colorado DMV paperwork support."
        x={884}
        y={662}
        opacity={cardIn(3.8)}
        active={active(4.3)}
      />
      <StepCard
        index="4"
        title="Drive"
        detail="Leave knowing what to expect next."
        x={1280}
        y={750}
        opacity={cardIn(4.8)}
        active={active(5.3)}
      />
      <svg style={{position: 'absolute', inset: 0}} viewBox="0 0 1920 1080">
        <path
          d="M 282 716 C 485 632, 650 866, 902 716 S 1275 620, 1476 804"
          fill="none"
          stroke="rgba(11,30,102,0.13)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 282 716 C 485 632, 650 866, 902 716 S 1275 620, 1476 804"
          fill="none"
          stroke={lime}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${interpolate(frame, [2.1 * fps, 6.2 * fps], [0, 1240], clamp)} 1240`}
        />
      </svg>
      <div
        style={{
          ...fullText,
          position: 'absolute',
          left: 88,
          top: 312,
          opacity: finalOpacity,
          color: deepNavy,
        }}
      >
        <div style={{fontSize: 32, color: lime, fontWeight: 950}}>LifeSafer at InterlockGo NOCO</div>
        <div style={{fontSize: 86, fontWeight: 950, lineHeight: 0.94, marginTop: 22}}>
          Clear steps.
          <br />
          Better service.
        </div>
        <div style={{fontSize: 28, color: '#536079', fontWeight: 700, marginTop: 30}}>
          Evans and Greeley ignition interlock support.
        </div>
      </div>
      <ProgressBar progress={progress} light={false} />
    </AbsoluteFill>
  );
};
