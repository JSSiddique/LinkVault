import { useState, useRef } from "react";
import UploadList from "./UploadList";
import { API_BASE, authHeaders } from "./auth";

function Upload({ authToken, user, onLogout }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [protectWithPassword, setProtectWithPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [limitViews, setLimitViews] = useState(false);
  const [maxViews, setMaxViews] = useState("");
  const [shareId, setShareId] = useState("");
  const [lastProtected, setLastProtected] = useState(false);
  const [showSharePasswordModal, setShowSharePasswordModal] =
    useState(false);
  const [sharePassword, setSharePassword] = useState("");
  const [sharePasswordError, setSharePasswordError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  const fileRef = useRef(null);
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const allowedTypes = [
    "application/pdf",
    "application/json",
  ];
  const canSubmit =
    (text.trim().length > 0 || !!file) &&
    !error &&
    !(text && file);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (file) {
      const isAllowed =
        file.type.startsWith("image/") ||
        file.type.startsWith("video/") ||
        file.type.startsWith("text/") ||
        allowedTypes.includes(file.type);

      if (!isAllowed) {
        setError("Invalid file type");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("File size is too large");
        return;
      }
    }

    const fd = new FormData();
    if (text) fd.append("text", text);
    if (file) fd.append("file", file);
    if (protectWithPassword) fd.append("password", password);
    if (limitViews) fd.append("maxViews", maxViews);

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      headers: {
        ...authHeaders(authToken),
      },
      body: fd,
    });

    if (res.status === 401) {
      onLogout();
      return;
    }

    if (!res.ok) {
      const d = await res.json();
      setError(d.message || "Upload failed");
      return;
    }

    const data = await res.json();
    setShareId(data.shareId);
    setLastProtected(!!protectWithPassword);

    setText("");
    setFile(null);
    setPassword("");
    setProtectWithPassword(false);
    setLimitViews(false);
    setMaxViews("");
    fileRef.current.value = "";
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <header className="px-6 pt-8">
        <div className="max-w-6xl mx-auto flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight">
              LinkVault
            </h1>
            <p className="text-sm text-slate-600 mt-1">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 px-6 py-8 lg:flex-row lg:items-start lg:h-[calc(100vh-160px)]">
          <aside className="glass-card rounded-2xl p-6 lg:w-[420px] lg:sticky lg:top-6 h-fit">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-slate-500">
                  Paste Text
                </label>
                <textarea
                  placeholder="Drop quick notes, snippets, or secure text..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={!!file}
                  className="mt-2 w-full min-h-[140px] rounded-xl border border-slate-200 bg-white p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 uppercase tracking-widest">
                <span className="h-px flex-1 bg-slate-200" />
                OR
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <label className="block text-center cursor-pointer">
                <input
                  type="file"
                  hidden
                  ref={fileRef}
                  disabled={!!text}
                  accept="image/*,video/*,text/*,application/pdf,application/json"
                  onChange={(e) => {
                    const selected = e.target.files[0];
                    if (!selected) return;

                    const isAllowed =
                      selected.type.startsWith("image/") ||
                      selected.type.startsWith("video/") ||
                      selected.type.startsWith("text/") ||
                      allowedTypes.includes(selected.type);

                    if (!isAllowed) {
                      setError("Invalid file type");
                      setFile(null);
                      e.target.value = "";
                      return;
                    }

                    if (selected.size > MAX_FILE_SIZE) {
                      setError("Max size limit exceeded");
                      setFile(null);
                      e.target.value = "";
                      return;
                    }

                    setError("");
                    setFile(selected);
                  }}
                />
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                  Select file
                </span>
              </label>
              {file && (
                <div className="text-center text-sm text-slate-600">
                  {file.name}
                </div>
              )}
              {error === "Max size limit exceeded" && (
                <div className="text-center text-sm text-red-600">
                  Max size limit exceeded
                </div>
              )}
              {error === "Invalid file type" && (
                <div className="text-center text-sm text-red-600">
                  Invalid file type
                </div>
              )}

              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={protectWithPassword}
                    onChange={(e) =>
                      setProtectWithPassword(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Protect with password
                </label>

                {protectWithPassword && (
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={limitViews}
                    onChange={(e) => setLimitViews(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Limit number of views
                </label>

                {limitViews && (
                  <input
                    type="number"
                    min="1"
                    placeholder="Max views"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              <button
                disabled={!canSubmit}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                  canSubmit
                    ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                Create Link
              </button>

              {shareId && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 space-y-2">
                  <div>Link created:</div>
                  <div className="break-all text-emerald-800">
                    http://localhost:5173/view/{shareId}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lastProtected ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSharePassword("");
                          setSharePasswordError("");
                          setShowSharePasswordModal(true);
                        }}
                        className="text-xs border border-emerald-200 px-2 py-1 rounded hover:bg-emerald-100 cursor-pointer"
                      >
                        Open with password
                      </button>
                    ) : (
                      <a
                        href={`http://localhost:5173/view/${shareId}`}
                        target="_blank"
                        className="text-xs border border-emerald-200 px-2 py-1 rounded hover:bg-emerald-100"
                      >
                        Open
                      </a>
                    )}
                  </div>
                </div>
              )}

              {error &&
                error !== "Invalid file type" &&
                error !== "Max size limit exceeded" && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}
            </form>
          </aside>

          <main className="glass-card rounded-2xl p-0 lg:flex-1 lg:h-full overflow-hidden flex flex-col">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex-none">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl">Recent Links</h2>
                  <p className="text-sm text-slate-600">
                    All active shares with view limits and status.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <UploadList
                refreshKey={refreshKey}
                authToken={authToken}
                onAuthError={onLogout}
              />
            </div>
          </main>
        </div>
      </div>

      {showSharePasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-5 w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Enter password</div>
              <button
                onClick={() => setShowSharePasswordModal(false)}
                className="text-slate-500 hover:text-slate-700 cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sharePassword}
              onChange={(e) => setSharePassword(e.target.value)}
            />
            {sharePasswordError && (
              <div className="text-sm text-red-600">
                {sharePasswordError}
              </div>
            )}
            <button
              onClick={async () => {
                setSharePasswordError("");
                try {
                  const res = await fetch(
                    `${API_BASE}/api/view/${shareId}?password=${encodeURIComponent(
                      sharePassword
                    )}`
                  );

                  if (res.status === 401 || res.status === 403) {
                    const d = await res.json();
                    setSharePasswordError(
                      d.message || "Invalid password"
                    );
                    return;
                  }

                  if (!res.ok) {
                    const d = await res.json();
                    setSharePasswordError(
                      d.message || "Unable to open"
                    );
                    return;
                  }

                  setShowSharePasswordModal(false);
                  const url = `http://localhost:5173/view/${shareId}?password=${encodeURIComponent(
                    sharePassword
                  )}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                } catch {
                  setSharePasswordError("Unable to open");
                }
              }}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload;
