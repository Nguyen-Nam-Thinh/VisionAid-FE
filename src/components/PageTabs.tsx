import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import * as AnimatedTabs from '@animate-ui/react/primitives/radix-ui/tabs';

export type PageTab = {
  value: string;
  label: string;
  icon?: LucideIcon;
  /** Small number shown on the tab, e.g. unread or failed items. */
  count?: number;
  content: ReactNode;
};

/**
 * Splits a page into tabs instead of stacking unrelated cards one under another. Every panel
 * stays mounted, so filters, pages and dialogs survive switching tabs.
 */
export function PageTabs({
  label,
  tabs,
  defaultValue,
}: {
  label: string;
  tabs: (PageTab | false | null | undefined)[];
  defaultValue?: string;
}) {
  const shown = tabs.filter((tab): tab is PageTab => !!tab);
  if (shown.length === 1) return <>{shown[0].content}</>;
  return (
    <AnimatedTabs.Root
      defaultValue={defaultValue ?? shown[0]?.value}
      className="glass card stack page-tabs"
    >
      <AnimatedTabs.List className="tabs-list" aria-label={label}>
        {shown.map(({ value, label: text, icon: Icon, count }) => (
          <AnimatedTabs.Trigger key={value} value={value} className="tabs-trigger">
            {Icon && <Icon size={16} aria-hidden="true" />}
            {text}
            {!!count && <span className="tabs-count">{count}</span>}
          </AnimatedTabs.Trigger>
        ))}
      </AnimatedTabs.List>
      {shown.map(({ value, content }) => (
        <AnimatedTabs.Content key={value} value={value} forceMount className="page-tabs-panel">
          {content}
        </AnimatedTabs.Content>
      ))}
    </AnimatedTabs.Root>
  );
}
