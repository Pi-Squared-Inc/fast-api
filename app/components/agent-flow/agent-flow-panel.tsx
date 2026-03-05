'use client';

import { ApiActionCard } from './api-action-card';
import type { ApiActionCardProps } from './api-action-card';

type AgentFlowPanelProps = {
  title?: string;
  subtitle?: string;
  actions: ApiActionCardProps[];
};

export function AgentFlowPanel({
  title = 'Agent Flow',
  subtitle = 'Exact endpoint/method references with copy-ready snippets and examples.',
  actions,
}: AgentFlowPanelProps) {
  return (
    <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', padding: '1rem', display: 'grid', gap: '0.7rem' }}>
      <header style={{ display: 'grid', gap: '0.2rem' }}>
        <h2 style={{ fontSize: '0.95rem', margin: 0 }}>{title}</h2>
        <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.74rem' }}>
          {subtitle}
        </p>
      </header>

      <div style={{ display: 'grid', gap: '0.65rem' }}>
        {actions.map((action) => (
          <ApiActionCard
            key={`${action.title}-${action.request.method}-${action.request.url}`}
            {...action}
          />
        ))}
      </div>
    </section>
  );
}
