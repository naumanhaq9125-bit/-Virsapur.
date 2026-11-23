# Virsapur Production Admin user guide

> Dormant future-hosting reference. The current Virsapur workflow is localhost-only; use `STUDIO_USER_GUIDE.md` and **Publish to Local Production**. No hosted Admin is active or required.

## Sign in

Open `https://your-production-domain/admin/`. Signed-out or expired sessions return to `/admin/login/`. Use only an approved owner/editor account. Do not share passwords or leave an authenticated computer unattended.

The sidebar says **PRODUCTION CMS** in the hosted Admin. If it says **DEV SANDBOX**, you are in Local Studio and cannot publish to the live site.

## Draft and autosave

Choose a content collection and a record. Field changes autosave after a short pause. **Draft autosaved · public site unchanged** confirms the working copy was saved. The Save draft button performs the same safe write immediately.

The body editor supports paragraph, heading, quote, image, gallery, callout, and HTTPS embed blocks. Use arrows to reorder and Remove to delete a block from the working draft. Editors never need to edit JSON.

## Preview

Choose Preview from a record or the sidebar. Draft preview is authenticated, noindex, and uses the public styles. Use Desktop, Tablet, and Mobile to check responsive layouts. A preview is not evidence that content is live.

## Review and revisions

Use `draft` while writing and `review` when editorial review is requested. The record history lists earlier revisions, why each was captured, and which top-level fields differ. **Restore as draft** changes only the working copy; preview and Publish are still required.

## Publish

1. Save the record.
2. Check summary, body, image/alt text, slug, SEO, geographic links, and preview.
3. Choose **Publish** and confirm.
4. Watch the deployment pill: queued → building → ready.
5. Open the public page only after Ready.

Save is never Publish. If Vercel status polling is not configured, Admin states that live confirmation is unavailable; verify in Vercel before describing the content as live.

## Unpublish

Choose **Unpublish** on a published record and confirm. The record is removed from the published snapshot and a deployment starts. The live page remains until that deployment succeeds. Use redirects where a replacement URL is required.

## Media

Upload JPG, PNG, or WebP, complete alt text/caption/credit, and set the focal point. Admin stores the original and 640/1280 WebP derivatives. Media deletion is intentionally not exposed; remove content references and follow an owner-reviewed recovery procedure before deleting an object in Supabase.

## Backups and import

Any Admin user may choose **Export backup**. Only owners can import. Import creates working revisions and does not publish. Follow `BACKUP_AND_RECOVERY.md`.

## Roles

- Owner: all editorial actions, backup import, canonical site settings/navigation, and account-level coordination.
- Editor: content, media, preview, revisions, and publishing; canonical site settings are server-blocked.

## Acceptance test after setup

Create one clearly temporary draft record, preview desktop/tablet/mobile, Publish, wait for Ready, confirm the public URL/SEO, Unpublish, wait for Ready, and confirm the public site returned to baseline. Do not reuse a real page for this test.

Payments remain disabled in production. Mock checkout and Mock Orders exist only in Local Studio/demo mode.
