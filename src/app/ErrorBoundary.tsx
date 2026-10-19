import { Component, type ReactNode } from 'react';
import { StatusPage, reloadAction } from '../pages/shared/StatusPage';

type Props = {
  children: ReactNode;
  /** 'root' wraps the whole app (no router); 'route' wraps one screen inside the shell. */
  scope?: 'root' | 'route';
  /** Changing this value (e.g. the pathname) clears a caught error so navigation recovers. */
  resetKey?: string;
};
type State = { error: Error | null; key?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const root = this.props.scope !== 'route';
    return (
      <StatusPage
        kind="error"
        standalone={root}
        // Raw messages can contain user data; show them only in development builds.
        detail={import.meta.env.DEV ? error.message : undefined}
        actions={
          <>
            {reloadAction}
            <a className="btn" href={root ? '/' : '/dashboard'}>
              {root ? 'Về trang chủ' : 'Về tổng quan'}
            </a>
          </>
        }
      />
    );
  }
}
