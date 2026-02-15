import { useCallback, useEffect, useState } from "react";
import { API_BASE, authHeaders } from "./auth";

function UploadList({ refreshKey, authToken, onAuthError }) {
  const [uploads, setUploads] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingShareId, setPendingShareId] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchUploads = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/list`, {
      headers: {
        ...authHeaders(authToken),
      },
    });

    if (res.status === 401) {
      onAuthError();
      return;
    }

    setUploads(await res.json());
  }, [authToken, onAuthError]);

  const deleteLink = async (shareId) => {
    const shouldDelete = window.confirm(
      "Delete this link? This cannot be undone."
    );
    if (!shouldDelete) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/upload/${shareId}`,
        {
          method: "DELETE",
          headers: {
            ...authHeaders(authToken),
          },
        }
      );

      if (res.status === 401) {
        onAuthError();
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to delete link");
      }

      setUploads((prev) => prev.filter((item) => item.shareId !== shareId));
    } catch {
      window.alert("Unable to delete link");
    }
  };

  useEffect(() => {
    fetchUploads();
    const i = setInterval(fetchUploads, 10000);
    return () => clearInterval(i);
  }, [fetchUploads, refreshKey]);

  return (
    <>
      <div className="space-y-3">
        {uploads.map((u) => {
          const limitReached =
            u.maxViews !== null && u.viewCount >= u.maxViews;

          return (
            <div
              key={u.shareId}
              className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">
                    {u.originalFileName || "Text"}
                  </span>
                  {u.isPasswordProtected && (
                    <span className="text-[11px] uppercase tracking-widest border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full bg-amber-50">
                      Password protected
                    </span>
                  )}
                </div>
                {u.maxViews !== null && (
                  <div className="text-xs text-slate-500 mt-1">
                    Views: {u.viewCount}/{u.maxViews}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {!u.expired && !limitReached ? (
                  u.isPasswordProtected ? (
                    <button
                      className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      onClick={() => {
                        setPendingShareId(u.shareId);
                        setPassword("");
                        setPasswordError("");
                        setShowPasswordModal(true);
                      }}
                    >
                      Open
                    </button>
                  ) : (
                    <a
                      href={`http://localhost:5173/view/${u.shareId}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      Open
                    </a>
                  )
                ) : u.maxViewsReached ? (
                  <span className="text-xs text-slate-400">
                    Max view reached
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Unavailable</span>
                )}

                <button
                  className="text-rose-600 hover:text-rose-700 text-sm font-medium cursor-pointer"
                  onClick={() => deleteLink(u.shareId)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-5 w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Enter password</div>
              <button
                onClick={() => setShowPasswordModal(false)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {passwordError && (
              <div className="text-sm text-red-600">{passwordError}</div>
            )}
            <button
              onClick={async () => {
                setPasswordError("");
                try {
                  const res = await fetch(
                    `${API_BASE}/api/view/${pendingShareId}?password=${encodeURIComponent(
                      password
                    )}`
                  );

                  if (res.status === 401 || res.status === 403) {
                    const d = await res.json();
                    setPasswordError(d.message || "Invalid password");
                    return;
                  }

                  if (!res.ok) {
                    const d = await res.json();
                    setPasswordError(d.message || "Unable to open");
                    return;
                  }

                  setShowPasswordModal(false);
                  const url = `http://localhost:5173/view/${pendingShareId}?password=${encodeURIComponent(
                    password
                  )}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                } catch {
                  setPasswordError("Unable to open");
                }
              }}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default UploadList;
