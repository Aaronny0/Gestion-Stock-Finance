"use client";
import { useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Eye, EyeOff } from "lucide-react";
import styles from "./auth-design.module.css";

export function AuthNotice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={`${styles.notice} ${error ? styles.error : styles.success}`} role={error ? "alert" : "status"}>{error ? <CircleAlert size={16} /> : <CircleCheck size={16} />}<span>{children}</span></div>;
}

export function AuthField({ name, label, value, onChange, type = "text", autoComplete, placeholder, minLength, maxLength = 160, required = true, error, aside, strength = false, disabled = false }: {
  name: string; label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string; placeholder?: string; minLength?: number; maxLength?: number; required?: boolean; error?: string; aside?: ReactNode; strength?: boolean; disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  const score = Number(value.length >= 8) + Number(value.length >= 12) + Number(/[A-Z]/.test(value) && /[a-z]/.test(value)) + Number(/[0-9\W]/.test(value));
  return <div className={styles.field}><div className={styles.labelRow}><label htmlFor={`auth-${name}`}>{label}</label>{aside}</div>
    <div className={styles.inputWrap}><input id={`auth-${name}`} name={name} type={password && visible ? "text" : type} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} placeholder={placeholder} minLength={minLength} maxLength={maxLength} required={required} disabled={disabled} aria-invalid={!!error} aria-describedby={error ? `auth-${name}-error` : strength ? `auth-${name}-strength` : undefined} />
      {password && <button type="button" className={styles.eye} aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
    </div>
    {error && <small id={`auth-${name}-error`} className={styles.fieldError}>{error}</small>}
    {strength && <div className={styles.strength}><div aria-hidden="true">{[0, 1, 2, 3].map(i => <span key={i} style={{ background: i < score ? score > 2 ? "#1a763f" : "#b67612" : "#dde3e4" }} />)}</div><small id={`auth-${name}-strength`}>{!value ? "12 caractères minimum, avec chiffres ou symboles." : value.length < 12 ? "Trop court : utilisez au moins 12 caractères." : ["Faible", "Faible", "Correct", "Bon", "Excellent"][score]}</small></div>}
  </div>;
}
