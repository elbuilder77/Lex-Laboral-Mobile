import React, { useEffect, useState } from 'react';

interface DebugData {
  innerW: number;
  innerH: number;
  dpr: number;
  screenW: number;
  screenH: number;
  vvW: number;
  vvH: number;
  bodyPad: string;
  navBg: string;
  navPos: string;
  navRect: string;
  docH: number;
  isNative: boolean;
}

const read = (): DebugData => {
  const nav = document.querySelector('[data-debug-nav]');
  const navStyle = nav ? getComputedStyle(nav) : null;
  const navRect = nav ? nav.getBoundingClientRect() : null;
  const bodyStyle = getComputedStyle(document.body);
  const vv = window.visualViewport;
  return {
    innerW: window.innerWidth,
    innerH: window.innerHeight,
    dpr: window.devicePixelRatio,
    screenW: window.screen.width,
    screenH: window.screen.height,
    vvW: vv ? Math.round(vv.width) : 0,
    vvH: vv ? Math.round(vv.height) : 0,
    bodyPad: `t${bodyStyle.paddingTop} r${bodyStyle.paddingRight} b${bodyStyle.paddingBottom} l${bodyStyle.paddingLeft}`,
    navBg: navStyle ? navStyle.backgroundColor : 'n/a',
    navPos: navStyle ? navStyle.position : 'n/a',
    navRect: navRect ? `${Math.round(navRect.y)}/${Math.round(navRect.height)}` : 'n/a',
    docH: document.documentElement.scrollHeight,
    isNative: (window as any).Capacitor?.isNativePlatform() ?? false,
  };
};

export const DebugPanel: React.FC = () => {
  const [d, setD] = useState<DebugData>(() => read());

  useEffect(() => {
    const t = setInterval(() => setD(read()), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed left-0 top-0 z-[9999] bg-black/90 text-lime-300 font-mono text-[10px] leading-[1.4] p-2 rounded-br-xl pointer-events-none no-print">
      <div>inner {d.innerW}x{d.innerH} dpr {d.dpr}</div>
      <div>screen {d.screenW}x{d.screenH}</div>
      <div>visualVp {d.vvW}x{d.vvH}</div>
      <div>docH {d.docH}</div>
      <div>bodyPad {d.bodyPad}</div>
      <div>nav {d.navPos} bg={d.navBg} rectY={d.navRect}</div>
      <div>native={String(d.isNative)}</div>
    </div>
  );
};
