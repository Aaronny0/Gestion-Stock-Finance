"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useId,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { installHistoryGuard } from "./history";
import { canonical, parentRoute } from "./navigation";
import { api, request } from "./api";
import { createDemo, executeDemo } from "./demo";
import {
  rolePermissions,
  type Permission,
  type Role,
  type Snapshot,
  type UserSession,
  type Sale,
} from "./types";
interface Workspace {
  locationKey: string;
  goBack: () => void;
  readView: <T>(key: string, initial: T) => T;
  writeView: <T>(key: string, value: T) => void;
  registerDraft: (id: string, label: string) => () => void;
  confirmDiscard: () => boolean;
  snapshot: Snapshot | null;
  loading: boolean;
  error: string;
  demo: boolean;
  storeId: string;
  setStoreId: (id: string) => void;
  start: string;
  end: string;
  setDates: (start: string, end: string) => void;
  can: (permission: Permission) => boolean;
  command: (
    type: string,
    payload: Record<string, unknown>,
  ) => Promise<{ reference: string; sale?: Sale }>;
  reload: () => void;
  setRole: (role: Role) => void;
  href: (path: string) => string;
  notice: string;
  setNotice: (s: string) => void;
  setOrganization: (id: string) => void;
}
const Context = createContext<Workspace | null>(null);
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("WorkspaceProvider requis");
  return value;
}
export function useUnsavedChanges(dirty: boolean, label: string) {
  const { registerDraft } = useWorkspace();
  const id = useId();
  useEffect(() => {
    if (dirty) return registerDraft(id, label);
  }, [dirty, id, label, registerDraft]);
  return () =>
    !dirty ||
    window.confirm(
      `${label} : abandonner les modifications non enregistrées ?`,
    );
}
/** Only non-sensitive list preferences are retained, in memory, for this workspace session. */
export function useViewState<T>(
  name: string,
  initial: T,
): [T, (next: SetStateAction<T>) => void] {
  const { readView, writeView, storeId, snapshot, locationKey } =
    useWorkspace();
  const path = usePathname();
  const key = `${snapshot?.session.organization.id}:${snapshot?.session.user.role}:${storeId}:${locationKey || path}:${name}`;
  const [value, setValue] = useState<T>(() => readView(key, initial));
  const update = (next: SetStateAction<T>) => {
    const result =
      typeof next === "function" ? (next as (old: T) => T)(value) : next;
    writeView(key, result);
    setValue(result);
  };
  return [value, update];
}
export const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/invite/activate",
];
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname(),
    router = useRouter(),
    demo = pathname === "/demo" || pathname.startsWith("/demo/"),
    isPublic = publicRoutes.includes(pathname);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [storeId, setStore] = useState("s1"),
    [organizationId, setOrganizationId] = useState(""),
    [version, setVersion] = useState(0),
    [notice, setNotice] = useState("");
  const viewCache = useRef(new Map<string, unknown>());
  const readView = useCallback(
    <T,>(key: string, initial: T): T =>
      (viewCache.current.has(key) ? viewCache.current.get(key) : initial) as T,
    [],
  );
  const writeView = useCallback(<T,>(key: string, value: T) => {
    if (viewCache.current.size > 300 && !viewCache.current.has(key))
      viewCache.current.delete(viewCache.current.keys().next().value!);
    viewCache.current.set(key, value);
  }, []);
  const historyControl = useRef<ReturnType<typeof installHistoryGuard> | null>(
    null,
  );
  const [locationKey, setLocationKey] = useState("");
  const drafts = useRef(new Map<string, string>());
  const registerDraft = useCallback((id: string, label: string) => {
    drafts.current.set(id, label);
    return () => {
      drafts.current.delete(id);
    };
  }, []);
  const confirmDiscard = useCallback(
    () =>
      !drafts.current.size ||
      window.confirm(
        `Des modifications ne sont pas enregistrées (${[...drafts.current.values()].join(", ")}). Les abandonner ?`,
      ),
    [],
  );
  useEffect(() => {
    const control = installHistoryGuard(confirmDiscard, setLocationKey);
    historyControl.current = control;
    return () => {
      control.dispose();
      historyControl.current = null;
    };
  }, [confirmDiscard]);
  const goBack = () =>
    historyControl.current?.back(() =>
      router.replace(
        (demo ? "/demo" : "") +
          (parentRoute(canonical(pathname)) === "/"
            ? demo
              ? ""
              : "/"
            : parentRoute(canonical(pathname))),
      ),
    );
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (drafts.current.size) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.button !== 0
      )
        return;
      const next = new URL(anchor.href, location.href);
      if (
        next.pathname === location.pathname &&
        next.search === location.search
      )
        return;
      if (!confirmDiscard()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [confirmDiscard]);
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(today.slice(0, 7) + "-01"),
    [end, setEnd] = useState(today);
  const demoData = useRef<Snapshot | null>(null),
    pending = useRef(false),
    key = useRef<{ signature: string; value: string } | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (/^\d{4}-\d{2}-\d{2}$/.test(q.get("start") || ""))
      setStart(q.get("start")!);
    if (/^\d{4}-\d{2}-\d{2}$/.test(q.get("end") || "")) setEnd(q.get("end")!);
  }, [pathname, locationKey]);
  useEffect(() => {
    if (isPublic) {
      setLoading(false);
      setSnapshot(null);
      return;
    }
    setLoading(true);
    setError("");
    const abort = new AbortController();
    if (demo) {
      demoData.current ??= createDemo();
      setSnapshot(demoData.current);
      setLoading(false);
    } else {
      setSnapshot(null);
      api
        .snapshot(storeId, start, end, abort.signal, organizationId)
        .then((data) => {
          setSnapshot(data);
          if (
            !data.session.stores.some((s) => s.id === storeId) &&
            storeId !== "all"
          )
            setStore(data.session.defaultStoreId);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => {
          if (!abort.signal.aborted) setLoading(false);
        });
    }
    return () => abort.abort();
  }, [demo, isPublic, storeId, start, end, version, organizationId]);
  useEffect(() => {
    if (demo || isPublic) return;
    let active = true;
    const check = () => {
      if (document.visibilityState !== "visible") return;
      request<UserSession>("session")
        .then((session) => {
          if (!active) return;
          setSnapshot((previous) =>
            previous ? { ...previous, session } : previous,
          );
        })
        .catch((error) => {
          if (error.status === 403) {
            setSnapshot(null);
            setError(error.message);
          }
        });
    };
    const timer = setInterval(check, 60000);
    window.addEventListener("focus", check);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [demo, isPublic]);
  const setStoreId = (id: string) => {
    if (id === storeId || !confirmDiscard()) return;
    if (!demo) setSnapshot(null);
    setStore(id);
    setNotice("");
  };
  const setDates = (a: string, b: string) => {
    if (a > b || !confirmDiscard()) return;
    setStart(a);
    setEnd(b);
    const q = new URLSearchParams(location.search);
    q.set("start", a);
    q.set("end", b);
    router.replace(`${pathname}?${q}`, { scroll: false });
  };
  const command = useCallback(
    async (type: string, payload: Record<string, unknown>) => {
      if (pending.current) throw new Error("Une opération est déjà en cours.");
      if (!navigator.onLine && !demo)
        throw new Error("Reconnectez-vous pour valider une opération.");
      if (storeId === "all")
        throw new Error("Choisissez une boutique pour cette opération.");
      pending.current = true;
      const signature = JSON.stringify({
        type,
        payload,
        storeId,
        organizationId,
      });
      if (key.current?.signature !== signature)
        key.current = { signature, value: crypto.randomUUID() };
      try {
        let reference = "";
        let sale: Sale | undefined;
        if (demo && demoData.current) {
          const result = executeDemo(demoData.current, {
            type,
            payload,
            storeId,
            idempotencyKey: key.current!.value,
          });
          demoData.current = result.snapshot;
          setSnapshot(result.snapshot);
          reference = result.reference;
          sale = result.snapshot.data.sales.find(
            (s) => s.reference === reference,
          );
        } else {
          const result = await api.command({
            type,
            payload: {
              ...payload,
              organizationId: snapshot?.session.organization.id,
            },
            storeId,
            idempotencyKey: key.current!.value,
          });
          reference = result.reference ?? "";
          sale = result.sale;
          setVersion((v) => v + 1);
        }
        key.current = null;
        setNotice(
          `Opération enregistrée${reference ? ` · ${reference}` : ""}${demo ? " en démonstration" : ""}.`,
        );
        return { reference, sale };
      } finally {
        pending.current = false;
      }
    },
    [demo, storeId, organizationId, snapshot?.session.organization.id],
  );
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  const can = (p: Permission) =>
    snapshot?.session.permissions.includes(p) ?? false;
  const setRole = (role: Role) => {
    if (!demo || !demoData.current || !confirmDiscard()) return;
    demoData.current = {
      ...demoData.current,
      session: {
        ...demoData.current.session,
        user: { ...demoData.current.session.user, role },
        permissions: rolePermissions[role],
      },
    };
    setSnapshot(demoData.current);
    router.push(
      "/demo" +
        (role === "cashier"
          ? "/pos"
          : role === "stock"
            ? "/stock"
            : role === "accountant"
              ? "/accounting"
              : ""),
    );
  };
  return (
    <Context.Provider
      value={{
        locationKey,
        goBack,
        readView,
        writeView,
        registerDraft,
        confirmDiscard,
        snapshot,
        loading,
        error,
        demo,
        storeId,
        setStoreId,
        start,
        end,
        setDates,
        can,
        command,
        reload: () => setVersion((v) => v + 1),
        setRole,
        href: (path) => (demo ? `/demo${path === "/" ? "" : path}` : path),
        notice,
        setNotice,
        setOrganization: (id) => {
          if (id === organizationId || !confirmDiscard()) return;
          setSnapshot(null);
          setOrganizationId(id);
          setStore("");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
