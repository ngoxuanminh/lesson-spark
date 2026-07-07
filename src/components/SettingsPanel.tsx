import { useState, useCallback } from "react";
import { createPortal } from "react-dom";

type TestStatus = "idle" | "testing" | "success" | "error";

const COACHIO_URL = "https://api.coachio.ai/api/v1/llm/chat/completions";

interface SettingsPanelProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onClear: () => void;
}

export function SettingsPanel({ apiKey, onApiKeyChange, onClear }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [pasteFailed, setPasteFailed] = useState(false);

  const handleOpen = useCallback(() => {
    setDraft(apiKey);
    setTestStatus("idle");
    setTestMessage("");
    setOpen(true);
  }, [apiKey]);

  const handleSave = useCallback(() => {
    onApiKeyChange(draft.trim());
    setOpen(false);
  }, [draft, onApiKeyChange]);

  const handleClear = useCallback(() => {
    onClear();
    setDraft("");
    setTestStatus("idle");
    setTestMessage("");
  }, [onClear]);

  const handleDraftChange = useCallback((value: string) => {
    setDraft(value);
    setTestStatus("idle");
    setTestMessage("");
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) handleDraftChange(text.trim());
    } catch {
      setPasteFailed(true);
      setTimeout(() => setPasteFailed(false), 2000);
    }
  }, [handleDraftChange]);

  const handleTest = useCallback(async () => {
    const key = draft.trim();
    if (!key) {
      setTestStatus("error");
      setTestMessage("Please enter an API key first.");
      return;
    }

    setTestStatus("testing");
    setTestMessage("");

    try {
      const res = await fetch(COACHIO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": key,
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite",
          stream: false,
          max_tokens: 20,
          messages: [
            { role: "user", content: "Say 'Hello' in one word." },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json() as { choices?: { message?: { content?: string } }[] };
        const reply = data.choices?.[0]?.message?.content ?? "";
        setTestStatus("success");
        setTestMessage(`✅ Connected! Model replied: "${reply.slice(0, 80)}"`);
      } else {
        const text = await res.text().catch(() => "");
        setTestStatus("error");
        setTestMessage(`❌ HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
    } catch (e) {
      setTestStatus("error");
      setTestMessage(`❌ ${e instanceof Error ? e.message : "Connection failed"}`);
    }
  }, [draft]);

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 6)}${"•".repeat(Math.max(0, apiKey.length - 10))}${apiKey.slice(-4)}`
    : "";

  const trimmedDraft = draft.trim();
  const looksValid = trimmedDraft.length > 0 && trimmedDraft.startsWith("sk-") && trimmedDraft.length > 10;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="grid h-11 w-11 place-items-center rounded-2xl bg-card/70 text-lg transition hover:bg-card hover:shadow-md"
        title="Settings"
      >
        ⚙️
      </button>

      {/* Modal overlay */}
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg animate-pop-in overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">⚙️ Settings</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Configure your Coachio API key
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-sm transition hover:bg-secondary/80"
              >
                ✕
              </button>
            </div>

            {/* Current status */}
            <div className="mt-5 rounded-2xl bg-secondary/50 p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${apiKey ? "bg-success" : "bg-destructive"}`} />
                <span className="font-semibold">
                  {apiKey ? "API key configured" : "No API key set"}
                </span>
              </div>
              {apiKey && (
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  {maskedKey}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-bold" htmlFor="settings-api-key">
                🔑 Coachio API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="settings-api-key"
                    type={showKey ? "text" : "password"}
                    value={draft}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    placeholder="sk-..."
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-xl border border-border bg-card/70 px-4 py-3 pr-12 font-mono text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                    title={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? "🙈" : "👁️"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handlePaste}
                  title="Dán từ clipboard"
                  className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl bg-secondary/70 text-base transition hover:bg-secondary"
                >
                  {pasteFailed ? "❌" : "📋"}
                </button>
              </div>

              {trimmedDraft.length > 0 && (
                <p
                  className={`mt-1.5 text-xs font-semibold ${
                    looksValid ? "text-success-foreground" : "text-peach-foreground"
                  }`}
                >
                  {looksValid
                    ? "✓ Định dạng hợp lệ"
                    : '⚠️ API key thường bắt đầu bằng "sk-" — kiểm tra lại nhé'}
                </p>
              )}

              <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                🔒 Key được lưu cục bộ trên trình duyệt, không gửi lên server của chúng tôi.
              </p>
            </div>

            {/* Test result */}
            {testMessage && (
              <div
                className={`mt-4 rounded-xl p-3 text-sm ${
                  testStatus === "success"
                    ? "bg-success/15 text-success-foreground"
                    : testStatus === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-secondary"
                }`}
              >
                {testMessage}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={handleTest}
                disabled={testStatus === "testing" || !draft.trim()}
                className="rounded-2xl bg-lavender px-5 py-3 text-sm font-bold text-lavender-foreground transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {testStatus === "testing" ? "⏳ Testing…" : "🧪 Test connection"}
              </button>
              <button
                onClick={handleSave}
                disabled={!draft.trim()}
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-pop)] transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                💾 Save key
              </button>
              {apiKey && (
                <button
                  onClick={handleClear}
                  className="rounded-2xl bg-peach/60 px-5 py-3 text-sm font-bold text-peach-foreground transition hover:-translate-y-0.5"
                >
                  🗑️ Remove key
                </button>
              )}
            </div>

            {/* Help */}
            <details className="mt-5 rounded-xl bg-sky/20 p-4">
              <summary className="cursor-pointer text-sm font-bold text-sky-foreground">
                ℹ️ How to get an API key?
              </summary>
              <ol className="mt-2 space-y-1.5 pl-5 text-sm text-muted-foreground list-decimal">
                <li>Go to <a href="https://coachio.ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">coachio.ai</a></li>
                <li>Sign up or log in to your account</li>
                <li>Navigate to <strong>Settings → API Keys</strong></li>
                <li>Create a new key and copy it here</li>
              </ol>
            </details>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
