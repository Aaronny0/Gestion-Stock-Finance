/** Register before the router, including browsers without cancellable native traversal. */
export function installEarlyHistoryDispatcher() {
  const target = window as Window & {
    __vortexPopGuards?: Set<(event: PopStateEvent) => void>;
  };
  if (target.__vortexPopGuards) return;
  const guards = new Set<(event: PopStateEvent) => void>();
  target.__vortexPopGuards = guards;
  window.addEventListener("popstate", event => {
    for (const guard of guards) {
      guard(event);
      if (event.cancelBubble) break;
    }
  }, true);
}
