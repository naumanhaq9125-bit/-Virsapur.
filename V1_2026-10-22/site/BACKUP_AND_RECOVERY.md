# Virsapur backup and recovery

## Existing pre-migration recovery point

`backups/pre-production-cms-migration/2026-09-01/` contains 149 baseline files totalling 53,403,996 bytes, all listed with SHA-256 hashes in `SNAPSHOT_MANIFEST.json`. It includes canonical content, fixtures, referenced assets, Studio/runtime data, builder source, and deployment configuration. Demo fixtures are present only for local recovery and are excluded from production import.

## Routine backup

At least weekly and before a large publishing batch:

1. Sign in to Production Admin.
2. Choose **Export backup** on the Dashboard.
3. Store the downloaded JSON in an access-controlled location with the date in its filename.
4. Use Supabase scheduled database backups according to the selected plan.
5. Keep Storage backups/versioning appropriate to the media library.
6. Retain Vercel’s last known-good deployment for immediate static rollback.

Exports contain content and media metadata, not passwords, Auth users, API keys, mock orders, or binary media objects. Storage objects and the database must also be backed up at provider level.

## Restore one content record

Open the record in Admin, review its changed-field summary, choose **Restore as draft**, preview it, and Publish only after approval. The currently published snapshot is unchanged until that explicit Publish.

## Restore a content export

Only an owner can import:

1. Export the current state first.
2. Select the known-good `virsapur-content-export/v1` file on the Dashboard.
3. Confirm import.
4. Review affected drafts and revision history.
5. Preview and Publish deliberately.

The import rejects demo fixtures, validates IDs/slugs/workflow states, and creates revisions before replacements. It does not trigger an automatic deployment.

## Recover from a failed publication

- If Vercel reports failed, leave the current live deployment in place and inspect build logs.
- Correct the draft or restore a revision.
- Retry Publish.
- If incorrect content is live, choose Unpublish or restore the prior revision, then Publish to create a corrective deployment.

## Provider rollback

Set `CMS_DATA_MODE=local` in Vercel and redeploy the source snapshot. This rebuilds the current public design from `content/data`. Keep `PAYMENT_MODE=disabled`. Do not delete hosted data while operating in rollback mode.

## Recovery drill

Quarterly, restore an export into a non-production Supabase project, build with `CMS_DATA_MODE=production`, and run both QA modes. Record counts, screenshot comparison, map drill-down, and route/SEO results. Never use the production Deploy Hook for a recovery rehearsal.
