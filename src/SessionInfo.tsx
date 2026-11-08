import { useEffect, useRef, useState } from "react";
import { Cloud, ShieldCheck, X, LoaderCircle } from "lucide-react";
import { supabase } from "./data";
export function SessionInfo({
  connected,
  saving,
}: {
  connected: boolean;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false),
    [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDialogElement>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!open) return;
    const dialog = ref.current;
    const previousFocus = document.activeElement as HTMLElement;
    dialog?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = old;
      queueMicrotask(() => {
        if (previousFocus?.isConnected) previousFocus.focus();
      });
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open]);
  function close() {
    setClosing(true);
    timer.current = setTimeout(
      () => {
        setOpen(false);
        setClosing(false);
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 160,
    );
  }
  return (
    <>
      <button
        className="session-trigger"
        onClick={() => setOpen(true)}
        aria-label="How your work is saved"
      >
        {saving ? (
          <LoaderCircle size={15} className="spin" />
        ) : (
          <Cloud size={15} />
        )}
        <span>
          {saving
            ? "Saving…"
            : connected
              ? "Guest workspace"
              : "Workspace status"}
        </span>
        <span className="header-avatar">G</span>
      </button>
      {open && (
        <dialog
          ref={ref}
          className={`session-dialog ${closing ? "is-closing" : ""}`}
          aria-labelledby="session-heading"
          onCancel={(e) => {
            e.preventDefault();
            close();
          }}
        >
          <div className="dialog-head">
            <h2 id="session-heading">Your private workspace</h2>
            <button
              className="icon-button"
              onClick={close}
              aria-label="Close workspace information"
            >
              <X size={20} />
            </button>
          </div>
          <div className="dialog-content">
            <span className="session-emblem">
              <ShieldCheck size={28} />
            </span>
            <h3>No sign-in needed.</h3>
            <p>
              {supabase
                ? "You’re signed in automatically as a guest. Your tasks are saved securely to the cloud and belong only to this guest session."
                : "You’re exploring a local demo. Tasks are saved only in this browser."}
            </p>
            <div className="session-details">
              <strong>Coming back later?</strong>
              <p>
                Use this same browser and profile. Your workspace will be here
                when you return.
              </p>
              <strong>Keep your guest session</strong>
              <p>
                Clearing browser data or ending an incognito session loses
                access to these tasks. Guest workspaces don’t transfer to
                another browser or device.
              </p>
            </div>
            <span className={`session-state ${connected ? "" : "attention"}`}>
              <span className="online-dot" />
              {connected
                ? supabase
                  ? "Guest session connected"
                  : "Local demo ready"
                : "Connection needs attention"}
            </span>
          </div>
          <div className="dialog-actions">
            <button className="primary" onClick={close}>
              Got it
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
