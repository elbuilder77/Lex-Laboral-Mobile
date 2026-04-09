import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export const WorkspacePage: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('h-full overflow-y-auto animate-fade-in bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.10),_transparent_24%),linear-gradient(180deg,_#fcfcfb_0%,_#f8fafc_38%,_#f3f6fb_100%)]', className)}>
    <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-12">{children}</div>
  </div>
);

export const WorkspaceHeader: React.FC<{
  eyebrow?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, description, icon, actions }) => (
  <motion.header
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
  >
    <div className="max-w-3xl">
      {eyebrow ? <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">{eyebrow}</p> : null}
      <div className="flex items-start gap-4">
        <div className="ui-icon-chip mt-1">{icon}</div>
        <div>
          <h2 className="text-4xl font-serif font-bold tracking-tight text-slate-950 md:text-5xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">{description}</p>
        </div>
      </div>
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
  </motion.header>
);

export const WorkspacePanel: React.FC<{ children: React.ReactNode; className?: string; muted?: boolean }> = ({
  children,
  className,
  muted = false,
}) => (
  <section className={cn(muted ? 'ui-panel-muted' : 'ui-panel', className)}>
    {children}
  </section>
);

export const WorkspaceEmpty: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}> = ({ icon, title, description, className }) => (
  <div className={cn('ui-empty-state', className)}>
    <div className="ui-empty-icon">{icon}</div>
    <h3 className="text-xl font-serif font-bold text-slate-900">{title}</h3>
    <p className="max-w-sm text-sm leading-7 text-slate-500">{description}</p>
  </div>
);

export const WorkspaceStat: React.FC<{
  label: string;
  value: string;
  emphasis?: 'default' | 'accent' | 'inverse';
}> = ({ label, value, emphasis = 'default' }) => (
  <div
    className={cn(
      'rounded-[1.75rem] border p-6 text-center',
      emphasis === 'inverse'
        ? 'border-slate-900 bg-slate-950 text-white shadow-[0_18px_60px_-34px_rgba(15,23,42,0.85)]'
        : 'border-slate-200/80 bg-white/90 backdrop-blur-sm',
    )}
  >
    <span className={cn('text-[11px] font-bold uppercase tracking-[0.25em]', emphasis === 'inverse' ? 'text-white/45' : 'text-slate-400')}>
      {label}
    </span>
    <p className={cn('mt-3 font-serif text-2xl font-bold', emphasis === 'accent' ? 'text-legal-gold' : emphasis === 'inverse' ? 'text-white' : 'text-slate-950')}>
      {value}
    </p>
  </div>
);
