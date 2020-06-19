export function convertSnaps<T>(snaps) {
  return <T[]>snaps.map((snap) => ({
    id: snap.payload.doc.id,
    ...(snap.payload.doc.data() as {}),
  }));
}
