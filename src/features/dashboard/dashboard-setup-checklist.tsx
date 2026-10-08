import Link from "next/link";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import styles from "./dashboard.module.css";
type SetupStep = { label: string; path: string; done: boolean };
export function DashboardSetupChecklist({
  steps,
  href,
}: {
  steps: SetupStep[];
  href: (path: string) => string;
}) {
  const completed = steps.filter((step) => step.done).length;
  if (completed === steps.length) return null;
  return (
    <details className={styles.setup} open={completed < 2}>
      <summary>
        <span
          className={styles.progress}
          style={{
            background: `conic-gradient(var(--primary) ${(completed / steps.length) * 100}%, var(--accent) 0)`,
          }}
        >
          <span>
            {completed}/{steps.length}
          </span>
        </span>
        <span>
          <strong>Mise en route</strong>
          <small>
            Configuration à finaliser · {steps.length - completed} étape
            {steps.length - completed > 1 ? "s" : ""} restante
            {steps.length - completed > 1 ? "s" : ""}
          </small>
        </span>
        <ChevronDown size={18} />
      </summary>
      <div className={styles.setupSteps}>
        {steps.map((step) => (
          <Link key={step.path} href={href(step.path)} data-done={step.done}>
            {step.done ? <Check size={16} /> : <ArrowRight size={16} />}
            {step.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
