import React from "react";
import { images as imagesApi } from "./db.js";

/**
 * Images for one parent row, grouped by role and ordered within each role.
 * Returns `{}` while loading, so callers can render empty slots immediately.
 */
export function useImages(parentType, parentId) {
  const [grouped, setGrouped] = React.useState({});

  const reload = React.useCallback(async () => {
    if (!parentId) {
      setGrouped({});
      return;
    }
    setGrouped(await imagesApi.listFor(parentType, parentId));
  }, [parentType, parentId]);

  React.useEffect(() => {
    let alive = true;
    if (!parentId) {
      setGrouped({});
      return;
    }
    imagesApi
      .listFor(parentType, parentId)
      .then((g) => alive && setGrouped(g))
      .catch(() => alive && setGrouped({}));
    return () => {
      alive = false;
    };
  }, [parentType, parentId]);

  return { grouped, reload };
}
