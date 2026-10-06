/** Preserve Next.js history state and block a cancelled traversal before its router sees it. */
export function installHistoryGuard(
  confirmLeave: () => boolean,
  onLocation: (url: string) => void,
) {
  const key = "__vortexHistory";
  type Entry = { scope: string; index: number };
  const saved = history.state?.[key] as Entry | undefined;
  const scope = saved?.scope ?? crypto.randomUUID();
  let current = saved?.index ?? 0;
  let restoring: number | null = null;
  let traversalApproved = false;
  // Navigation API fires before popstate/router listeners can unmount a draft.
  // Keep the indexed History fallback for browsers without this API.
  const navigation = (window as Window & { navigation?: EventTarget }).navigation;
  const navigate = (event: Event) => {
    const traversal = event as Event & {
      navigationType?: string;
      destination?: { sameDocument?: boolean };
    };
    if (restoring !== null || traversal.navigationType !== "traverse" ||
        !traversal.destination?.sameDocument || !traversal.cancelable) return;
    if (!confirmLeave()) traversal.preventDefault();
    else traversalApproved = true;
  };
  navigation?.addEventListener("navigate", navigate);
  const push = history.pushState.bind(history),
    replace = history.replaceState.bind(history);
  replace(
    { ...history.state, [key]: { scope, index: current } },
    "",
    location.href,
  );
  let disposed = false;
  const publish = () => {
    const url = location.pathname + location.search;
    queueMicrotask(() => {
      if (!disposed) onLocation(url);
    });
  };
  const wrappedPush: History["pushState"] = (data, unused, url) => {
    if (disposed) return push(data, unused, url);
    const index = current + 1;
    push({ ...data, [key]: { scope, index } }, unused, url);
    current = index;
    publish();
  };
  const wrappedReplace: History["replaceState"] = (data, unused, url) => {
    if (disposed) return replace(data, unused, url);
    replace({ ...data, [key]: { scope, index: current } }, unused, url);
    publish();
  };
  history.pushState = wrappedPush;
  history.replaceState = wrappedReplace;
  const pop = (event: PopStateEvent) => {
    const target = event.state?.[key] as Entry | undefined;
    const approved = traversalApproved;
    traversalApproved = false;
    if (!target || target.scope !== scope) {
      publish();
      return;
    }
    if (restoring !== null) {
      event.stopImmediatePropagation();
      if (target.index === restoring) restoring = null;
      return;
    }
    if (target.index !== current && !approved && !confirmLeave()) {
      event.stopImmediatePropagation();
      restoring = current;
      history.go(current - target.index);
      return;
    }
    current = target.index;
    publish();
  };
  const earlyGuards = (window as Window & {
    __vortexPopGuards?: Set<(event: PopStateEvent) => void>;
  }).__vortexPopGuards;
  if (earlyGuards) earlyGuards.add(pop);
  else window.addEventListener("popstate", pop, true);
  publish();
  return {
    back(fallback: () => void) {
      if (current > 0) history.back();
      else if (confirmLeave()) fallback();
    },
    dispose() {
      disposed = true;
      earlyGuards?.delete(pop);
      window.removeEventListener("popstate", pop, true);
      navigation?.removeEventListener("navigate", navigate);
      if (history.pushState === wrappedPush) history.pushState = push;
      if (history.replaceState === wrappedReplace)
        history.replaceState = replace;
    },
  };
}
