import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { useSettingsStore, ThemeKey } from "../store/useSettingsStore";
import { useMessageStore } from "../store/useMessageStore";
import ThemeGrid from "../components/ThemeGrid";
// Small primitives
const Label: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <div>
    <p className="font-medium text-[var(--text)]">{children}</p>
    {hint ? <p className="text-sm text-[var(--subtle)]">{hint}</p> : null}
  </div>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-between py-2">{children}</div>
);

const Section: React.FC<{ title: string; desc?: string; children: React.ReactNode }> = ({
  title,
  desc,
  children,
}) => (
  <section className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 shadow-xl">
    <header className="mb-3">
      <h2 className="text-sm tracking-wide uppercase text-[var(--subtle)]">{title}</h2>
      {desc ? <p className="mt-0.5 text-sm text-[var(--subtle)]">{desc}</p> : null}
    </header>
    <div className="space-y-4">{children}</div>
  </section>
);

const Toggle: React.FC<{
  enabled: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  rightHint?: string;
}> = ({ enabled, onChange, label, rightHint }) => (
  <div className="flex items-center gap-3">
    {rightHint ? <span className="hidden text-xs text-[var(--subtle)] sm:block">{rightHint}</span> : null}

    <button
      type="button"
      aria-pressed={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        enabled ? "bg-emerald-500" : "bg-[var(--border)]",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-4 w-4 transform rounded-full bg-white transition",
          enabled ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  </div>
);

// Avatar Uploader
const AvatarUploader: React.FC<{
  objectUrl: string | null;
  setObjectUrl: (url: string | null) => void;
  onUpload: (file: File) => Promise<void>;
}> = ({ objectUrl, setObjectUrl, onUpload }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrl && objectUrl.startsWith('blob:')) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const openPicker = () => inputRef.current?.click();

  const onFile = async (file: File) => {
    setError("");
    setSuccess(false);
    const valid = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
    if (!valid.includes(file.type)) {
      setError("Unsupported file type. Use PNG, JPG, WEBP, GIF, or SVG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Max size 5MB.");
      return;
    }

    // Local preview
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    // Upload
    setIsUploading(true);
    try {
      await onUpload(file);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Upload failed", err);
      setError(err.message || "Upload failed");
      // Revert preview on failure if needed, or keep it so they can retry
    } finally {
      setIsUploading(false);
    }
  };

  const onInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const onRemove = () => {
    if (objectUrl && objectUrl.startsWith('blob:')) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    if (inputRef.current) inputRef.current.value = "";
    setSuccess(false);
    setError("");
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--card)] group">
        {objectUrl ? (
          <img src={objectUrl} alt="Avatar preview" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <span className="text-[11px] text-[var(--subtle)]">No Avatar</span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border border-dashed p-3 transition-colors ${isUploading ? "bg-[var(--bg)] border-[var(--border)] opacity-50 pointer-events-none" : "bg-[var(--card)] border-[var(--border)]"
            }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <p className="text-sm text-[var(--subtle)]">
            Drag & drop or{" "}
            <button className="underline underline-offset-2 text-[var(--accent)] hover:opacity-80" onClick={openPicker}>
              browse
            </button>
          </p>

          <div className="flex gap-2">
            <button
              onClick={openPicker}
              disabled={isUploading}
              className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--text)] hover:bg-[var(--bg)] disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>

            {objectUrl ? (
              <button
                onClick={onRemove}
                disabled={isUploading}
                className="rounded-md border border-[var(--border)] bg-rose-600/10 px-3 py-2 text-rose-300 hover:bg-rose-600/20 disabled:opacity-50"
              >
                Remove
              </button>
            ) : null}
          </div>

          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInput} />
        </div>

        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        {success ? <p className="mt-2 text-xs text-emerald-400">Avatar updated successfully!</p> : null}
        <p className="mt-2 text-xs text-[var(--subtle)]">PNG, JPG, WEBP, GIF, SVG. Max 5MB.</p>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const spotify = useSpotifyStore((s) => s.spotify);
  const connectSpotify = useSpotifyStore((s) => s.connect);
  const disconnectSpotify = useSpotifyStore((s) => s.disconnect);
  const uploadAvatar = useMessageStore((s) => s.uploadAvatar);
  const currentUser = useMessageStore((s) => s.currentUser);

  const {
    displayName,
    setDisplayName,
    avatarObjectUrl,
    setAvatarFilePreview,
    autoStartTimer,
    setAutoStartTimer,
    animations,
    setAnimations,
    theme,
    setTheme,
    glassMode,
    setGlassMode,
    dailyFocusGoal,
    setDailyFocusGoal,
    breakReminders,
    setBreakReminders,
    desktopNotifications,
    setDesktopNotifications,
    taskCompletedAlerts,
    setTaskCompletedAlerts,
    resetSettings,
  } = useSettingsStore();

  // Use currentUser.avatar if available, otherwise fallback to local preview or default
  const displayAvatar = currentUser?.avatar || avatarObjectUrl;

  const onExport = () => {
    const s = useSettingsStore.getState();
    const json = {
      settings: {
        displayName: s.displayName,
        avatarUrl: s.avatarUrl,
        autoStartTimer: s.autoStartTimer,
        animations: s.animations,
        theme: s.theme,
        glassMode: s.glassMode,
        dailyFocusGoal: s.dailyFocusGoal,
        breakReminders: s.breakReminders,
        desktopNotifications: s.desktopNotifications,
        taskCompletedAlerts: s.taskCompletedAlerts,
      },
    };
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `zenith-settings-${Date.now()}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const [confirmClear, setConfirmClear] = useState(false);
  const onClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 2200);
      return;
    }
    resetSettings();
    setConfirmClear(false);
  };



  return (
    <div className="space-y-8">
      {/* Profile */}
      <Section title="User Profile" desc="Your public identity in Zenith">
        <AvatarUploader
          objectUrl={displayAvatar}
          setObjectUrl={setAvatarFilePreview}
          onUpload={uploadAvatar}
        />
        <div>
          <p className="mb-1 text-sm text-[var(--subtle)]">Display Name</p>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </Section>

      {/* General */}
      <Section title="General" desc="Core app behavior">
        <Row>
          <Label hint="Timer starts automatically when starting a task">Auto-start Timer</Label>
          <Toggle enabled={autoStartTimer} onChange={setAutoStartTimer} rightHint={autoStartTimer ? "On" : "Off"} />
        </Row>

        <Row>
          <Label hint="Enable motion for transitions and UI feedback">Animations</Label>
          <Toggle enabled={animations} onChange={setAnimations} rightHint={animations ? "On" : "Off"} />
        </Row>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" desc="Visual theme and effects">

        <ThemeGrid />


        <Row>
          <Label hint="Frosted panels and translucency">Glass Mode</Label>
          <Toggle enabled={glassMode} onChange={setGlassMode} rightHint={glassMode ? "On" : "Off"} />
        </Row>
      </Section>

      {/* Productivity */}
      <Section title="Focus & Productivity" desc="Targets and healthy pacing">
        <Row>
          <Label hint="Hours to focus daily">Daily Focus Goal</Label>
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            value={dailyFocusGoal}
            onChange={(e) => setDailyFocusGoal(parseInt(e.target.value, 10))}
          >
            {[1, 2, 3, 4, 5, 6].map((h) => (
              <option key={h} value={h}>
                {h} hrs
              </option>
            ))}
          </select>
        </Row>

        <Row>
          <Label hint="Get notified when it's time to take a break">Break Reminders</Label>
          <Toggle enabled={breakReminders} onChange={setBreakReminders} rightHint={breakReminders ? "On" : "Off"} />
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" desc="System notifications and alerts">
        <Row>
          <Label>Desktop Notifications</Label>
          <Toggle
            enabled={desktopNotifications}
            onChange={setDesktopNotifications}
            rightHint={desktopNotifications ? "On" : "Off"}
          />
        </Row>

        <Row>
          <Label>Task Completed Alerts</Label>
          <Toggle
            enabled={taskCompletedAlerts}
            onChange={setTaskCompletedAlerts}
            rightHint={taskCompletedAlerts ? "On" : "Off"}
          />
        </Row>
      </Section>

      {/* Spotify */}
      <Section title="Music Integration" desc="Connect your Spotify for ambient focus music">
        <Row>
          <p className="font-medium text-[var(--text)]">Spotify Status</p>

          <span
            className={`rounded-md px-2.5 py-1 text-xs ${spotify?.accessToken
              ? "bg-emerald-600/10 text-emerald-300"
              : "bg-rose-600/10 text-rose-300"
              }`}
          >
            {spotify?.accessToken ? "Connected" : "Not Connected"}
          </span>
        </Row>

        {spotify?.accessToken ? (
          <button
            onClick={() => disconnectSpotify?.()}
            className="w-full rounded-lg border border-[var(--border)] bg-rose-600/10 px-4 py-2 text-rose-300 hover:bg-rose-600/20"
          >
            Disconnect Spotify
          </button>
        ) : (
          <button
            onClick={() => connectSpotify?.()}
            className="w-full rounded-lg border border-[var(--border)] bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            Connect Spotify
          </button>
        )}
      </Section>

      {/* Data Management */}
      <Section title="Data Management" desc="Export or reset your preferences">
        <div className="flex items-center justify-between rounded-lg border border-blue-700 bg-blue-900/20 p-4">
          <div>
            <p className="font-medium text-[var(--text)]">Export Your Data</p>
            <p className="text-sm text-[var(--subtle)]">Download a JSON file of settings</p>
          </div>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={onExport}>
            Export
          </button>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-rose-700 bg-rose-900/20 p-4">
          <div>
            <p className="font-medium text-rose-300">Clear All Data</p>
            <p className="text-sm text-[var(--subtle)]">Permanently resets settings</p>
          </div>
          <button
            onClick={onClearAll}
            className={`rounded-lg px-4 py-2 ${confirmClear ? "bg-rose-700 text-white" : "bg-rose-600 text-white hover:bg-rose-700"
              }`}
            title={confirmClear ? "Click again to confirm" : ""}
          >
            {confirmClear ? "Click to Confirm" : "Clear"}
          </button>
        </div>
      </Section>

      {/* Account */}
      <Section title="Account" desc="Manage your account session">
        <button
          onClick={() => useMessageStore.getState().logout()}
          className="w-full rounded-lg border border-rose-600/20 bg-rose-600/10 px-4 py-3 text-rose-400 hover:bg-rose-600/20 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </Section>
    </div>
  );
};

export default SettingsPage;
