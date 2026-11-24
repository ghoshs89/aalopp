# Nightly backup to TrueNAS and Google Drive

The TrueNAS keeps its own nightly copy of the Supabase database, and Google Drive keeps an encrypted copy of that.

```
Supabase Postgres ──pg_dump (nightly)──► TrueNAS  tank/backups/aalopp/db ──Cloud Sync (encrypted)──► Google Drive
```

What is backed up: the `public` schema (students, practice sessions, attempts). Questions and skills are already in git, and Google sign-in accounts can be recreated by signing in again.

## 1. Dataset and snapshots
1. **Datasets**, then **Add Dataset**: `tank/backups/aalopp/db` (use your pool name in place of `tank`).
2. **Data Protection**, then **Periodic Snapshot Tasks**, then **Add**: that dataset, daily, keep for 30 days.

## 2. Dump container (Custom App)
**Apps**, then **Discover Apps**, then the menu, then **Install via YAML**. Name it `aalopp-backup` and paste the following, replacing the connection string and path:

```yaml
services:
  pg-backup:
    # Must match the Supabase server's major version (17.x as of September 2026).
    image: postgres:17
    restart: unless-stopped
    environment:
      # The DIRECT_URL value (session pooler, port 5432). Supabase's direct host is IPv6-only, the pooler is not.
      DIRECT_URL: "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
    volumes:
      - /mnt/tank/backups/aalopp/db:/backups
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        while true; do
          ts=$$(date +%Y-%m-%d_%H%M)
          tmp="/backups/aalopp_$$ts.dump.tmp"
          out="/backups/aalopp_$$ts.dump"
          if pg_dump "$$DIRECT_URL" --format=custom --no-owner --schema=public --file="$$tmp" && [ -s "$$tmp" ]; then
            mv "$$tmp" "$$out"
            echo "backup ok $$ts"
            ls -1t /backups/aalopp_*.dump | tail -n +31 | xargs -r rm --
          else
            rm -f "$$tmp"
            echo "backup FAILED $$ts"
          fi
          sleep 86400
        done
```

It takes a backup when the app starts and every 24 hours after that, keeping the newest 30. Check the app's logs for `backup ok`.

## 3. Offsite copy to Google Drive
1. **Credentials**, then **Backup Credentials**, then **Cloud Credentials**, then **Add**: provider **Google Drive**, then **Log In To Provider**, using the Google One account.
2. **Data Protection**, then **Cloud Sync Tasks**, then **Add**:
   - Direction **Push**, transfer mode **Sync**
   - Source: `/mnt/tank/backups/aalopp`
   - Remote folder: `AALOPP-backup`
   - Schedule: daily, a few hours after the dump
   - **Remote Encryption: on.** Store the encryption password and salt in a password manager. Without them the Drive copy cannot be restored.

## 4. Test a restore (do this once, then every few months)
From the TrueNAS shell, restore the newest dump into a throwaway local Postgres and count rows:

```sh
docker run --rm -d --name restore-test -e POSTGRES_PASSWORD=test -v /mnt/tank/backups/aalopp/db:/backups postgres:17
sleep 5
LATEST=$(ls -1t /mnt/tank/backups/aalopp/db/aalopp_*.dump | head -1 | xargs basename)
docker exec restore-test pg_restore -U postgres -d postgres --no-owner /backups/$LATEST
docker exec restore-test psql -U postgres -c 'select count(*) from "Attempt";'
docker rm -f restore-test
```

The count should match the number of answers shown on the Grown-ups page, give or take a day.

## Keep-alive
Free Supabase projects pause after about a week without activity. The Vercel cron in `vercel.json` calls `/api/health` daily, and this nightly dump also counts as activity.
