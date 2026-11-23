# Virsapur local environment workflow

## Current operating model

```text
Studio (local editing)
        │ save
        ▼
Preview (local sandbox; automatic rebuild)
        │ explicit “Publish to Local Production”
        ▼
Local Production (clean local release)
```

All three environments bind to `127.0.0.1` and are accessible only from the computer running Virsapur Studio.

## Environment rules

### Studio

- Reads and writes `content/data/`.
- Creates a local revision before overwriting a content file.
- Rebuilds Preview after a successful save.
- Does not change Local Production when content is saved.

### Preview

- Uses the same templates as Local Production.
- Includes drafts, review records, published records, and separate demo fixtures.
- Displays the sandbox warning and uses restrictive noindex rules.
- Supports mock transactions only; no real payment is processed.

### Local Production

- Reads only the local content provider.
- Includes only records marked `published` and rejects demo records.
- Uses `http://127.0.0.1:4173/production` as its local canonical origin.
- Is built in a temporary directory and validated before replacing the last good release.
- Cannot contact Supabase or Vercel because the publishing process forces `CMS_DATA_MODE=local` and `PRODUCTION_CMS_ENABLED=false`.

## Future hosted CMS

The existing hosted CMS provider, API functions, migrations, and deployment integration are retained as dormant future code. They are outside the active local workflow and do not need credentials or configuration.
