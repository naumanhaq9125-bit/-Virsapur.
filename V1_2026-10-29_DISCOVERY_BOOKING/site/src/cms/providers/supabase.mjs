import { cmsConfig, assertProductionConfig } from "../config.mjs";
import { validateCollection, validateForPublish, validateSingleton } from "../validation.mjs";
import { CONTENT_COLLECTIONS, CONTENT_SINGLETONS } from "../../../backend/content-contract.mjs";

function encodeQuery(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== null) params.set(key, value);
  return params.toString();
}

export function createSupabaseProvider(options = {}) {
  const config = options.config || cmsConfig();
  assertProductionConfig(config);
  const fetchRequest = options.fetch || globalThis.fetch;
  async function request(path, { method = "GET", body, query, headers = {}, userToken, includeResponseMeta = false } = {}) {
    const suffix = query ? `?${encodeQuery(query)}` : "";
    const serialized = body === undefined ? undefined : JSON.stringify(body);
    if (serialized && Buffer.byteLength(serialized, "utf8") > 1048576) throw Object.assign(new Error("CMS request exceeds the 1 MiB transport limit; use bounded batches."), {status:413});
    const response = await fetchRequest(`${config.supabaseUrl}${path}${suffix}`, {
      method,
      headers: {
        apikey: config.supabaseSecretKey,
        authorization: `Bearer ${userToken || config.supabaseSecretKey}`,
        "content-type": "application/json",
        ...headers
      },
      body: serialized
    });
    const text = await response.text();
    const result = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(result?.message || result?.error_description || result?.hint || `Supabase request failed (${response.status})`);
    return includeResponseMeta ? {data:result,contentRange:response.headers.get("content-range"),status:response.status} : result;
  }
  const rest = (table, options = {}) => request(`/rest/v1/${table}`, options);
  async function restAll(table, query = {}) {
    const rows = [], size = 200;
    for (let offset = 0; offset < 100000; offset += size) {
      const batch = await rest(table, {query:{...query,limit:String(size),offset:String(offset)}});
      if (!Array.isArray(batch)) throw new Error("Unexpected CMS collection response.");
      rows.push(...batch); if(batch.length < size) return rows;
    }
    throw new Error("CMS collection exceeds the bounded import limit.");
  }
  async function writeBatches(table, rows, options = {}) {
    let batch=[],bytes=2;
    const flush=async()=>{if(batch.length)await rest(table,{...options,method:"POST",body:batch});batch=[];bytes=2;};
    for(const row of rows){const size=Buffer.byteLength(JSON.stringify(row),"utf8")+1;if(size>524288)throw Object.assign(new Error("A CMS record exceeds the 512 KiB save limit."),{status:413});if(batch.length>=100||bytes+size>524288)await flush();batch.push(row);bytes+=size;}await flush();
  }
  const rpc = (name, body) => request(`/rest/v1/rpc/${name}`, { method: "POST", body, headers: { Prefer: "return=representation" } });
  const audit = (action, actorId, detail = {}) => rest("cms_audit_log", { method: "POST", body: { action, actor_id: actorId, detail }, headers: { Prefer: "return=minimal" } });

  return {
    mode: "production",
    config,
    request,
    async loadAll({ publishedOnly = false, publicationVersionId } = {}) {
      const [singletons, records] = publishedOnly ? [
        await restAll("cms_live_snapshots", { select: "content_kind,collection,record_id,data,content_version", content_kind: "eq.singleton", order:"collection.asc,record_id.asc" }),
        await restAll("cms_live_snapshots", { select: "content_kind,collection,record_id,data,content_version", content_kind: "eq.record", order: "collection.asc,record_id.asc" })
      ] : await Promise.all([
        restAll("cms_singletons", { select: "key,status,data,updated_at",order:"key.asc" }),
        restAll("cms_records", { select: "collection,id,slug,status,data,updated_at", order: "collection.asc,id.asc" })
      ]);
      const result = Object.fromEntries(CONTENT_COLLECTIONS.map(name=>[name,[]]));
      for (const row of singletons) {
        const key = publishedOnly ? row.record_id : row.key;
        if (row.data && CONTENT_SINGLETONS.includes(key)) result[key] = row.data;
      }
      for (const row of records) {
        if (row.data && CONTENT_COLLECTIONS.includes(row.collection)) result[row.collection].push(row.data);
      }
      if (publishedOnly && publicationVersionId) {
        const candidates = await rest("cms_publication_versions", { query: { select: "*", id: `eq.${publicationVersionId}`, limit: "1" } });
        const candidate = candidates[0];
        if (!candidate || !["staged","building","verified"].includes(candidate.state)) throw Object.assign(new Error("Publication candidate is unavailable for this build."), { status: 409 });
        if (candidate.content_kind === "singleton") {
          if (candidate.candidate_data) result[candidate.record_id] = candidate.candidate_data;
          else delete result[candidate.record_id];
        } else if (result[candidate.collection]) {
          result[candidate.collection] = result[candidate.collection].filter(item => item.id !== candidate.record_id);
          if (candidate.candidate_data) result[candidate.collection].push(candidate.candidate_data);
        }
        const candidateText = JSON.stringify(candidate.candidate_data || {});
        const workingMedia = await restAll("cms_records", { select: "data", collection: "eq.media",order:"id.asc" });
        for (const row of workingMedia) if (row.data?.id && candidateText.includes(row.data.id) && !result.media.some(item => item.id === row.data.id)) result.media.push(row.data);
      }
      return result;
    },
    async save(name, value, actorId) {
      if (!(Array.isArray(value) ? CONTENT_COLLECTIONS : CONTENT_SINGLETONS).includes(name)) throw Object.assign(new Error("Unsupported content collection."), {status:422});
      if (Array.isArray(value)) {
        const errors = validateCollection(name, value);
        if (errors.length) throw Object.assign(new Error(errors.join("\n")), { status: 422, errors });
        const existing = await restAll("cms_records", { select: "collection,id,data,status,published_data", collection: `eq.${name}`,order:"id.asc" });
        const existingById = new Map(existing.map(row => [row.id, row]));
        const incomingById = new Map(value.map(record => [record.id, record]));
        const directPublish = value.filter(record => record.status === "published" && existingById.get(record.id)?.status !== "published");
        if (directPublish.length) throw Object.assign(new Error(`Save cannot publish records. Save as draft/review, then use Publish: ${directPublish.map(record => record.id).join(", ")}`), { status: 409 });
        const incoming = new Set(value.map(record => record.id));
        const removed = existing.filter(row => !incoming.has(row.id));
        if (removed.length) throw Object.assign(new Error(`Archive records instead of removing IDs: ${removed.map(row => row.id).join(", ")}`), { status: 409 });
        const changed = existing.filter(row => JSON.stringify(row.data) !== JSON.stringify(incomingById.get(row.id)));
        if (changed.length) await writeBatches("cms_revisions", changed.map(row => ({ collection: name, record_id: row.id, data: row.data, status: row.status, actor_id: actorId, reason: "save" })), {headers: { Prefer: "return=minimal" }});
        const now = new Date().toISOString();
        const changedIds = new Set(changed.map(row=>row.id));
        const rows = value.filter(data=>!existingById.has(data.id)||changedIds.has(data.id)).map(data => ({ collection: name, id: data.id, slug: data.slug || null, status: data.status === "published" ? "published" : (data.status || "draft"), data, updated_at: now, updated_by: actorId }));
        await writeBatches("cms_records", rows, {query: { on_conflict: "collection,id" }, headers: { Prefer: "resolution=merge-duplicates,return=minimal" }});
      } else {
        const errors = validateSingleton(name, value);
        if (errors.length) throw Object.assign(new Error(errors.join("\n")), { status: 422, errors });
        const current = await rest("cms_singletons", { query: { select: "key,data,status,published_data", key: `eq.${name}` } });
        if (current[0]) await rest("cms_revisions", { method: "POST", body: { collection: "singletons", record_id: name, data: current[0].data, status: current[0].status, actor_id: actorId, reason: "save" }, headers: { Prefer: "return=minimal" } });
        await rest("cms_singletons", { method: "POST", query: { on_conflict: "key" }, body: { key: name, data: value, status: current[0]?.status || "draft", updated_at: new Date().toISOString(), updated_by: actorId }, headers: { Prefer: "resolution=merge-duplicates,return=minimal" } });
      }
      await audit("content.saved", actorId, { name });
      return { ok: true };
    },
    async stagePublication({ contentKind = "record", collection, id, actorId, unpublish = false }) {
      if (contentKind === "record" && !unpublish) {
        const rows = await rest("cms_records", { query: { select: "data", collection: `eq.${collection}`, id: `eq.${id}`, limit: "1" } });
        if (!rows[0]) throw Object.assign(new Error("Record not found."), { status: 404 });
        const errors = validateForPublish(collection, rows[0].data);
        if (errors.length) throw Object.assign(new Error(errors.join("\n")), { status: 422, errors });
      }
      if (contentKind === "singleton" && !unpublish) {
        const rows = await rest("cms_singletons", { query: { select: "data", key: `eq.${id}`, limit: "1" } });
        if (!rows[0]) throw Object.assign(new Error("Singleton not found."), { status: 404 });
        const errors = validateSingleton(id, rows[0].data);
        if (errors.length) throw Object.assign(new Error(errors.join("\n")), { status: 422, errors });
      }
      const result = await rpc("stage_cms_publication", { p_content_kind: contentKind, p_collection: collection || "singletons", p_record_id: id, p_actor_id: actorId, p_unpublish: unpublish });
      return Array.isArray(result) ? result[0] : result;
    },
    async revisions({ collection, id, limit = 50 } = {}) {
      return rest("cms_revisions", { query: { select: "id,collection,record_id,status,data,reason,created_at,actor_id", order: "created_at.desc", limit: String(limit), ...(collection ? { collection: `eq.${collection}` } : {}), ...(id ? { record_id: `eq.${id}` } : {}) } });
    },
    async restoreRevision(revisionId, actorId) {
      const revisions = await rest("cms_revisions", { query: { select: "*", id: `eq.${revisionId}`, limit: "1" } });
      const revision = revisions[0];
      if (!revision) throw Object.assign(new Error("Revision not found."), { status: 404 });
      const rows = await rest("cms_records", { query: { select: "*", collection: `eq.${revision.collection}`, id: `eq.${revision.record_id}`, limit: "1" } });
      const current = rows[0];
      if (!current) throw Object.assign(new Error("Current record not found."), { status: 404 });
      await rest("cms_revisions", { method: "POST", body: { collection: current.collection, record_id: current.id, data: current.data, status: current.status, actor_id: actorId, reason: "pre-restore" }, headers: { Prefer: "return=minimal" } });
      const restoredStatus = current.status === "published" ? "published" : (revision.status === "archived" ? "draft" : revision.status);
      const data = { ...revision.data, status: restoredStatus };
      await rest("cms_records", { method: "PATCH", query: { collection: `eq.${current.collection}`, id: `eq.${current.id}` }, body: { data, status: restoredStatus, slug: data.slug || null, updated_at: new Date().toISOString(), updated_by: actorId }, headers: { Prefer: "return=minimal" } });
      await audit("revision.restored", actorId, { revisionId, collection: current.collection, id: current.id });
      return { ok: true, record: data };
    },
    async updatePublishJob(id, fields) {
      const result = await rest("cms_publish_jobs", { method: "PATCH", query: { id: `eq.${id}` }, body: fields, headers: { Prefer: "return=representation" } });
      return result[0];
    },
    async publishJob(id) {
      const result = await rest("cms_publish_jobs", { query: { select: "*", id: `eq.${id}`, limit: "1" } });
      return result[0] || null;
    },
    async publishJobForVersion(versionId) {
      const result = await rest("cms_publish_jobs", { query: { select: "*", publication_version_id: `eq.${versionId}`, limit: "1" } });
      return result[0] || null;
    },
    async updatePublicationVersion(id, fields) {
      const result = await rest("cms_publication_versions", { method: "PATCH", query: { id: `eq.${id}` }, body: { ...fields, updated_at: new Date().toISOString() }, headers: { Prefer: "return=representation" } });
      return result[0];
    },
    async publicationVersion(id) {
      const result = await rest("cms_publication_versions", { query: { select: "*", id: `eq.${id}`, limit: "1" } });
      return result[0] || null;
    },
    async promotePublication(versionId, actorId) {
      const result = await rpc("promote_cms_publication", { p_version_id: versionId, p_actor_id: actorId });
      await audit("publication.promoted", actorId, { versionId });
      return Array.isArray(result) ? result[0] : result;
    },
    async activity(limit = 100) {
      return rest("cms_audit_log", { query: { select: "id,action,actor_id,detail,created_at", order: "created_at.desc", limit: String(limit) } });
    }
  };
}
