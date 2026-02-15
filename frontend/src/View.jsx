import { useParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, authHeaders, getAuthToken } from "./auth";

function View() {
  const { shareId } = useParams();
  const base = `${API_BASE}/api/view`;

  const [needsPassword, setNeedsPassword] = useState(false);
  const [type, setType] = useState(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [error, setError] = useState("");
  const [views, setViews] = useState({ viewCount: 0, maxViews: null });
  const [autoOpened, setAutoOpened] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const authToken = getAuthToken();
  const initialLoadKeyRef = useRef("");
  const isFileReady = !needsPassword && type === "file" && !!fileUrl;

  const load = useCallback(async (pwOverride) => {
    try {
      setError("");
      const pw = pwOverride || "";
      const res = await fetch(
        pw
          ? `${base}/${shareId}?password=${pw}`
          : `${base}/${shareId}`
      );

      if (res.status === 401) {
        setNeedsPassword(false);
        setError("Password required. Open from the main list.");
        return;
      }

      if (!res.ok) {
        const d = await res.json();
        setError(d.message);
        return;
      }

      const data = await res.json();
      setType(data.type);
      setViews({
        viewCount: data.viewCount,
        maxViews: data.maxViews,
      });

      if (data.type === "text") {
        const consumeRes = await fetch(
          pw
            ? `${base}/${shareId}/consume?password=${pw}`
            : `${base}/${shareId}/consume`
        );

        if (!consumeRes.ok) {
          const d = await consumeRes.json();
          setError(d.message);
          return;
        }

        const consumeData = await consumeRes.json();
        setText(consumeData.content);
        setViews({
          viewCount: consumeData.viewCount,
          maxViews: consumeData.maxViews,
        });
      } else {
        setFileName(data.fileName);
        const consumeRes = await fetch(
          pw
            ? `${base}/${shareId}/consume?password=${pw}&json=1`
            : `${base}/${shareId}/consume?json=1`
        );

        if (!consumeRes.ok) {
          const d = await consumeRes.json();
          setError(d.message);
          return;
        }

        const consumeData = await consumeRes.json();
        setFileUrl(consumeData.fileUrl);
        setViews({
          viewCount: consumeData.viewCount,
          maxViews: consumeData.maxViews,
        });
      }
    } catch {
      setError("Failed to load content");
    }
  }, [base, shareId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pw = params.get("password") || "";
    const loadKey = `${shareId}:${pw}`;

    if (initialLoadKeyRef.current === loadKey) {
      return;
    }

    initialLoadKeyRef.current = loadKey;
    load(pw);
  }, [load, shareId]);

  const deleteLink = async () => {
    const shouldDelete = window.confirm(
      "Delete this link? This cannot be undone."
    );
    if (!shouldDelete) return;

    setIsDeleting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/upload/${shareId}`, {
        method: "DELETE",
        headers: {
          ...authHeaders(authToken),
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError("Login as the link owner to delete this link");
          return;
        }

        const d = await res.json().catch(() => ({}));
        setError(d.message || "Unable to delete link");
        return;
      }

      setDeleted(true);
      setType(null);
      setText("");
      setFileUrl("");
      setFileName("");
    } catch {
      setError("Unable to delete link");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!needsPassword && type === "file" && !autoOpened) {
      setAutoOpened(true);
    }
  }, [needsPassword, type, autoOpened]);

  return (
    <div className="min-h-screen bg-slate-100">
      {isFileReady ? (
        <div className="fixed inset-0 bg-white z-10">
          <iframe
            title={fileName}
            src={fileUrl}
            className="w-full h-full"
          />

          <div className="absolute top-4 right-4 z-20 bg-white/90 border border-slate-200 rounded-lg p-2 space-y-2">
            <button
              onClick={deleteLink}
              disabled={isDeleting || deleted || !authToken}
              className={`border px-3 py-1.5 text-sm rounded ${
                isDeleting || deleted || !authToken
                  ? "text-slate-400 border-slate-200 cursor-not-allowed"
                  : "text-rose-600 border-rose-200 hover:bg-rose-50"
              }`}
            >
              {deleted
                ? "Deleted"
                : isDeleting
                  ? "Deleting..."
                  : "Delete Link"}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded border border-slate-200 w-full max-w-xl mx-auto my-10 space-y-4">
          <div className="flex items-center justify-end">
            <button
              onClick={deleteLink}
              disabled={isDeleting || deleted || !authToken}
              className={`border px-3 py-1.5 text-sm rounded ${
                isDeleting || deleted || !authToken
                  ? "text-slate-400 border-slate-200 cursor-not-allowed"
                  : "text-rose-600 border-rose-200 hover:bg-rose-50"
              }`}
            >
              {deleted
                ? "Deleted"
                : isDeleting
                  ? "Deleting..."
                  : "Delete Link"}
            </button>
          </div>

          {!authToken && (
            <p className="text-xs text-slate-500 text-right">
              Login required for delete.
            </p>
          )}

          {deleted && (
            <p className="text-emerald-700 text-sm">Link deleted successfully.</p>
          )}

          {!needsPassword && type === "text" && (
            <>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed border border-slate-200 p-2 bg-slate-50/60 rounded max-h-72 overflow-auto">
                {text}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(text)}
                className="w-full border py-1.5 text-sm rounded"
              >
                Copy to Clipboard
              </button>
            </>
          )}

          {!needsPassword && type === "file" && !fileUrl && (
            <p className="text-sm text-slate-600">Opening file...</p>
          )}

          <div className="text-sm text-slate-600">
            Views: {views.viewCount}
            {views.maxViews !== null && ` / ${views.maxViews}`}
          </div>

          {error && <p className="text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default View;
