"use client";
import Link from "next/link";
import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Checkbox, Wordmark, Icon } from "@design-system";
import { authClient } from "@/lib/auth-client";
import { AuthPreview } from "./auth-preview";
import styles from "./auth.module.css";

type Mode = "login" | "signup" | "reset-password" | "verify" | "invite";
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [capabilities, setCapabilities] = useState<{ google: boolean; github: boolean; sso: boolean } | null>(null);
  useEffect(() => { let active = true; void fetch("/api/auth-capabilities").then(async response => { if (!response.ok) return; const result = await response.json() as { data: { google: boolean; github: boolean; sso: boolean } }; if (active) setCapabilities(result.data); }).catch(() => {}); return () => { active = false; }; }, []);
  const [english, setEnglish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mfa, setMfa] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [sso, setSso] = useState(false);
  const t = (pt: string, en: string) => english ? en : pt;
  const title = { login: t("Entrar", "Sign in"), signup: t("Criar conta", "Create account"), "reset-password": t("Redefinir senha", "Reset password"), verify: t("Verificar e-mail", "Verify email"), invite: t("Aceitar convite", "Accept invitation") }[mode];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "");
    const password = String(fields.get("password") ?? "");
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    try {
      if (mode === "invite") {
        const response = await fetch("/api/invitations/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
        if (!response.ok) throw new Error(t("Não foi possível aceitar. Entre com o e-mail convidado e confira o convite.", "Unable to accept. Sign in with the invited email and check the invitation."));
        router.push("/dashboard"); return;
      }
      const result = mfa ? recovery ? await authClient.twoFactor.verifyBackupCode({ code: String(fields.get("code")) }) : await authClient.twoFactor.verifyTotp({ code: String(fields.get("code")) })
        : sso ? await authClient.signIn.sso({ email, callbackURL: "/dashboard" })
        : mode === "signup" ? await authClient.signUp.email({ email, password, name: String(fields.get("name")), callbackURL: "/dashboard" })
        : mode === "login" ? await authClient.signIn.email({ email, password, rememberMe: fields.get("remember") === "on", callbackURL: "/dashboard" })
        : mode === "verify" ? token ? await authClient.verifyEmail({ query: { token } }) : await authClient.sendVerificationEmail({ email, callbackURL: "/dashboard" })
        : token ? await authClient.resetPassword({ newPassword: password, token }) : await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
      if (result.error) throw new Error(result.error.message ?? t("Falha na solicitação.", "Request failed."));
      if (mode === "login" && result.data && "twoFactorRedirect" in result.data && result.data.twoFactorRedirect) { setMfa(true); return; }
      if (mode === "login" || mfa || (mode === "verify" && token)) { const invitation = new URLSearchParams(window.location.search).get("invite"); router.push(invitation ? `/invite?token=${encodeURIComponent(invitation)}` : "/dashboard"); router.refresh(); }
      else setMessage(mode === "signup" ? t("Conta criada. Verifique seu e-mail antes de entrar.", "Account created. Verify your email before signing in.") : t("Solicitação processada. Se aplicável, confira seu e-mail. O envio exige um provedor configurado.", "Request processed. If applicable, check your email. Delivery requires a configured provider."));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("Falha de conexão. Tente novamente.", "Connection failed. Try again.")); }
    finally { setBusy(false); }
  }
  async function social(provider: "google" | "github") {
    setBusy(true); setError("");
    try { const result = await authClient.signIn.social({ provider, callbackURL: "/dashboard" }); if (result.error) throw new Error(result.error.message ?? "Provider unavailable"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("Provedor não configurado.", "Provider not configured.")); }
    finally { setBusy(false); }
  }
  return <main className={styles.layout}><section className={styles.panel}><header className={styles.top}><Link href="/" aria-label="Watchtower home"><Wordmark /></Link><Button variant="ghost" onClick={() => setEnglish(!english)}>{english ? "Português" : "English"}</Button></header>
    <form className={styles.form} onSubmit={event => { void submit(event); }}>
      <div><h1 className="wt-page-heading">{mfa ? t("Verificação em duas etapas", "Two-factor verification") : title}</h1><p className={styles.muted}>{t("Acesse seus workspaces e monitores.", "Access your workspaces and monitors.")}</p></div>
      {mode === "login" && !mfa && <div className={styles.social}><Button variant="secondary" disabled={busy || capabilities?.google === false} onClick={() => { void social("google"); }}>Google</Button><Button variant="secondary" disabled={busy || capabilities?.github === false} onClick={() => { void social("github"); }}>GitHub</Button></div>}
      {mode === "login" && !mfa && <div className={styles.row}><Button variant="ghost" disabled={capabilities?.sso === false} onClick={() => setSso(!sso)}>{sso ? t("Entrar com senha", "Use password") : t("Entrar com SSO (SAML)", "Sign in with SSO (SAML)")}</Button><Button variant="ghost" disabled={busy} onClick={() => { setBusy(true); void authClient.signIn.passkey().then(result => { if (result.error) setError(result.error.message ?? "Passkey failed"); else router.push("/dashboard"); }).catch(() => setError(t("Passkey indisponível.", "Passkey unavailable."))).finally(() => setBusy(false)); }}>Passkey</Button></div>}
      {mode === "login" && capabilities && (!capabilities.google || !capabilities.github || !capabilities.sso) && <span className={styles.providerNote}>{t("Google, GitHub e SSO disponíveis após configuração.", "Google, GitHub and SSO require configuration.")}</span>}
      {mode === "login" && !mfa && <div className={styles.divider}>{t("ou com e-mail", "or with email")}</div>}
      {mode === "signup" && <Input label={t("Nome", "Name")} name="name" autoComplete="name" required maxLength={100} />}
      {!mfa && mode !== "invite" && <div className={styles.credential}><Icon name="mail" size="sm" /><Input label="E-mail" name="email" type="email" autoComplete="email" required={mode !== "reset-password" && mode !== "verify"} /></div>}
      {!mfa && !sso && ["login", "signup", "reset-password"].includes(mode) && <div className={styles.credential}><Icon name="lock" size="sm" /><Input label={t("Senha", "Password")} name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : 10} required={mode !== "reset-password"} hint={mode === "reset-password" ? t("Preencha a nova senha apenas se chegou pelo link do e-mail.", "Enter a new password only when arriving from the email link.") : undefined} /></div>}
      {mfa && <Input label={recovery ? t("Código de recuperação", "Recovery code") : t("Código do autenticador", "Authenticator code")} name="code" inputMode={recovery ? "text" : "numeric"} autoComplete="one-time-code" required pattern={recovery ? undefined : "[0-9]{6}"} />}{mfa && <Button variant="ghost" onClick={() => setRecovery(!recovery)}>{recovery ? t("Usar autenticador", "Use authenticator") : t("Usar código de recuperação", "Use recovery code")}</Button>}
      {mode === "login" && !mfa && <div className={styles.row}><Checkbox label={t("Manter conectado por 30 dias", "Remember me for 30 days")} name="remember" defaultChecked /><a href="/reset-password">{t("Esqueci a senha", "Forgot password")}</a></div>}
      {mode === "invite" && <Button variant="secondary" onClick={() => { const invitation = new URLSearchParams(window.location.search).get("token") ?? ""; router.push(`/login?invite=${encodeURIComponent(invitation)}`); }}>{t("Entrar com o e-mail convidado", "Sign in with invited email")}</Button>}
      {mode === "invite" && <p>{t("Entre com o e-mail que recebeu o convite antes de aceitar.", "Sign in with the invited email before accepting.")}</p>}
      {error && <p role="alert" className="ds-error">{error}</p>}{message && <p role="status">{message}</p>}
      <Button className={styles.submit} type="submit" loading={busy}>{title}</Button>
      <a className={styles.accountLink} href={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? t("Não tem conta? Criar conta grátis", "No account? Create a free account") : t("Voltar para entrar", "Back to sign in")}</a>
      {mode === "login" && <a className={styles.secondaryLink} href="/verify">{t("Reenviar verificação de e-mail", "Resend email verification")}</a>}
    </form><footer className={styles.footer}><span>© 2026 Watchtower</span><Link href="/privacy">{t("Privacidade", "Privacy")}</Link><Link href="/terms">{t("Termos", "Terms")}</Link></footer></section>
    <AuthPreview english={english} /></main>;
}
