// Canonical version document and query projections are committed in one D1 batch.
export function projections(versionId, r, actor, now) {
  const rows = [];
  const emit = (sql, ...args) => rows.push({ sql, args });
  const meta = [now, actor, now, actor];
  for (const p of r.phases || []) {
    const pid = `${versionId}:${p.id}`;
    emit(
      'INSERT INTO regimen_phases VALUES(?,?,?,?,?,?,?)',
      pid,
      versionId,
      JSON.stringify(p),
      ...meta,
    );
    for (const o of p.orders) {
      const oid = `${versionId}:${o.id}`;
      emit(
        'INSERT INTO drugs VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',
        o.drugId,
        o.drugName,
        ...meta,
      );
      emit(
        'INSERT INTO regimen_drugs VALUES(?,?,?,?,?,?,?,?,?)',
        oid,
        versionId,
        pid,
        o.drugId,
        JSON.stringify(o),
        ...meta,
      );
      (o.clinicalRules || []).forEach((x, i) =>
        emit(
          'INSERT INTO regimen_rules VALUES(?,?,?,?,?,?,?,?)',
          `${oid}:r${i}`,
          versionId,
          oid,
          JSON.stringify(x),
          ...meta,
        ),
      );
      (o.allowedRoundingPolicies || []).forEach((k) =>
        emit(
          'INSERT INTO drug_rounding_policies VALUES(?,?,?,?,?,?,?,?)',
          `${oid}:${k}`,
          versionId,
          oid,
          k,
          ...meta,
        ),
      );
    }
  }
  (r.references || []).forEach((x, i) =>
    emit(
      'INSERT INTO regimen_references VALUES(?,?,?,?,?,?,?)',
      `${versionId}:ref${i}`,
      versionId,
      JSON.stringify(x),
      ...meta,
    ),
  );
  return rows;
}
