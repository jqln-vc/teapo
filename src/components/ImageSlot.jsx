// Replaces the design kit's <image-slot> web component.
//
// The kit persisted dropped images to a .image-slots.state.json sidecar via the
// Claude Design runtime, which does not exist outside it. This uploads to the
// private 'media' Supabase bucket and records a row in `images` instead, so a
// dropped photograph survives reload, sign-out, and a different machine.
//
// The bucket is private, so display goes through a signed URL that is refreshed
// when the row changes.

import React from "react";
import { createPortal } from "react-dom";
import { images as imagesApi } from "../lib/db.js";
import { IconBtn } from "../edit/EditKit.jsx";

export function useSignedUrl(row) {
  const [url, setUrl] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    if (!row) {
      setUrl(null);
      return;
    }
    imagesApi
      .signedUrls([row])
      .then((map) => alive && setUrl(map[row.id] ?? null))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [row?.id, row?.storage_path]);

  return url;
}

/**
 * Full-window image viewer. Rendered into document.body so no ancestor's
 * overflow, transform or stacking context can clip it.
 */
function Lightbox({ url, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="no-print"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="image viewer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(20,16,10,0.86)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "5vh 5vw",
        cursor: "zoom-out",
      }}
    >
      <img
        src={url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 4, boxShadow: "0 24px 70px rgba(0,0,0,0.55)", cursor: "default" }}
      />
      <button
        onClick={onClose}
        aria-label="close"
        title="close (Esc)"
        style={{
          position: "fixed",
          top: 18,
          right: 22,
          width: 34,
          height: 34,
          borderRadius: 999,
          cursor: "pointer",
          background: "rgba(251,246,228,0.10)",
          border: "1px solid rgba(251,246,228,0.35)",
          color: "#FBF6E4",
          fontFamily: "var(--font-mono)",
          fontSize: 17,
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
    </div>,
    document.body,
  );
}

export function ImageSlot({
  row,
  onUpload,
  onRemove,
  placeholder = "drop an image, or click to browse",
  radius = 10,
  style,
  editable = true,
}) {
  const url = useSignedUrl(row);
  const [over, setOver] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [zoom, setZoom] = React.useState(false);
  const [error, setError] = React.useState(null);
  const fileRef = React.useRef(null);

  const accept = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("not an image");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onUpload(file);
    } catch (e) {
      setError(e.message || "upload failed");
    } finally {
      setBusy(false);
    }
  };

  const filled = Boolean(row && url);

  // A filled slot opens the image; an empty one opens the file picker. Replacing a
  // filled slot is the hover button or a drag-and-drop, so a click never destroys
  // what is already there.
  const onClick = () => {
    if (busy) return;
    if (filled) setZoom(true);
    else if (editable) fileRef.current?.click();
  };

  const frame = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius,
    background: "var(--paper-warm)",
    border: `1px ${row ? "solid" : "dashed"} ${over ? "var(--green)" : "var(--line)"}`,
    cursor: filled ? "zoom-in" : editable ? "pointer" : "default",
    ...style,
  };

  return (
    <div
      style={frame}
      onDragOver={(e) => {
        if (!editable) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!editable) return;
        e.preventDefault();
        setOver(false);
        accept(e.dataTransfer.files?.[0]);
      }}
      onClick={onClick}
    >
      {url ? (
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            lineHeight: 1.5,
            color: "var(--text-faint)",
            textAlign: "center",
            padding: "10px 14px",
          }}
        >
          {busy ? "uploading…" : error ? error : placeholder}
        </span>
      )}

      {editable && row && (
        <div className="no-print" style={{ position: "absolute", top: 6, right: 6, zIndex: 3, display: "flex", gap: 4 }}>
          <IconBtn
            kind="edit"
            color="var(--brown-soft)"
            size={22}
            title="replace this image"
            onClick={(e) => {
              e.stopPropagation();
              fileRef.current?.click();
            }}
          />
          <IconBtn
            kind="del"
            color="var(--red)"
            size={22}
            title="remove this image"
            onClick={async (e) => {
              e.stopPropagation();
              setBusy(true);
              try {
                await onRemove();
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      )}

      {zoom && url && <Lightbox url={url} onClose={() => setZoom(false)} />}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/**
 * A variable-length, ordered run of image slots — used by the research figures
 * and plates, and by guide illustration blocks. Ordering is persisted; adding
 * appends, and each existing image can be removed independently.
 */
export function ImageList({ rows = [], role, parentType, parentId, onChanged, placeholder, height = 200, editable = true }) {
  const upload = (file) =>
    imagesApi.upload(file, { parentType, parentId, role, siblings: rows }).then(onChanged);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((row) => (
        <ImageSlot
          key={row.id}
          row={row}
          placeholder={placeholder}
          style={{ width: "100%", height }}
          editable={editable}
          onUpload={upload}
          onRemove={() => imagesApi.remove(row).then(onChanged)}
        />
      ))}

      {/* Always leave one empty slot to drop into. */}
      {editable && (
        <ImageSlot
          row={null}
          placeholder={placeholder}
          style={{ width: "100%", height }}
          onUpload={upload}
          onRemove={() => {}}
        />
      )}
    </div>
  );
}
