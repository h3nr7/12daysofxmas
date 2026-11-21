// The only file allowed to import `useNavigate` and `Link` from
// react-router (see no-restricted-imports in eslint.config.js). Every
// in-app move goes through these, so debug mode stays in the URL.

import { ReactNode, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { withDebug } from './debug'

/** `navigate(path)`, carrying debug mode over from the current URL. */
// eslint-disable-next-line react-refresh/only-export-components -- hook lives beside its link component
export function useDebugNavigate() {
  const navigate = useNavigate()
  const { search } = useLocation()
  return useCallback((path: string) => navigate(withDebug(path, search)), [navigate, search])
}

/** react-router's `Link`, carrying debug mode over from the current URL. */
export function DebugLink({ to, children }: { to: string; children: ReactNode }) {
  const { search } = useLocation()
  return <Link to={withDebug(to, search)}>{children}</Link>
}
