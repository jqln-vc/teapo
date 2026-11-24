// Fractional indexing.
//
// Every ordered collection stores a `position` string. To move an item between two
// neighbours we generate a key that sorts strictly between their two keys — so a
// reorder is a single-row UPDATE, no matter how long the list is, and two clients
// reordering different items never fight over the same rows.
//
// Keys are base-62 fractions. The digit alphabet is in ascending ASCII order, and
// the Postgres columns are `collate "C"` (bytewise), so JS string comparison and
// database ORDER BY agree exactly.
//
// Invariant: a key never ends in '0'. That guarantees there is always room to
// insert before any existing key, which is what makes the recursion below terminate.

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Returns a key strictly between `a` and `b`.
 * `a === null` means "before everything", `b === null` means "after everything".
 */
function midpoint(a, b) {
  if (b !== null && a >= b) {
    throw new Error(`frac: cannot order, ${JSON.stringify(a)} >= ${JSON.stringify(b)}`);
  }
  if (a.endsWith("0") || (b !== null && b.endsWith("0"))) {
    throw new Error("frac: key ends in '0', invariant broken");
  }

  if (b !== null) {
    // Strip the longest common prefix and recurse on the remainder.
    let n = 0;
    while ((a[n] || "0") === b[n]) n++;
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
  }

  const digitA = a === "" ? 0 : DIGITS.indexOf(a[0]);
  const digitB = b !== null ? DIGITS.indexOf(b[0]) : DIGITS.length;

  // Room between the leading digits: land halfway.
  if (digitB - digitA > 1) {
    return DIGITS[Math.round(0.5 * (digitA + digitB))];
  }

  // Leading digits are adjacent. Either borrow b's first digit...
  if (b !== null && b.length > 1) return b.slice(0, 1);

  // ...or keep a's and go one digit deeper.
  return DIGITS[digitA] + midpoint(a.slice(1), null);
}

/** Key that sorts between `a` and `b`. Pass null for "start" / "end" of the list. */
export function keyBetween(a, b) {
  if (a !== null && b !== null && a >= b) {
    throw new Error(`frac: ${JSON.stringify(a)} >= ${JSON.stringify(b)}`);
  }
  return midpoint(a ?? "", b ?? null);
}

/** `n` ascending keys, for seeding a fresh list. */
export function keysAfter(after, n) {
  const out = [];
  let prev = after;
  for (let i = 0; i < n; i++) {
    prev = keyBetween(prev, null);
    out.push(prev);
  }
  return out;
}

/**
 * The key an item needs to sit at index `toIndex` of `list`, having been removed
 * from wherever it was. `list` must already be sorted by position.
 */
export function keyForMove(list, movingId, toIndex) {
  const without = list.filter((x) => x.id !== movingId);
  const before = without[toIndex - 1] ?? null;
  const after = without[toIndex] ?? null;
  return keyBetween(before?.position ?? null, after?.position ?? null);
}

export const byPosition = (a, b) => (a.position < b.position ? -1 : a.position > b.position ? 1 : 0);
