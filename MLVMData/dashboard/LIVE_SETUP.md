# MLVM Dashboard — Live Google Sheet connection

The registration Sheet (`NGO_नोंदणी`) must remain **private**. This dashboard does **not** publish individual NGOs, registration IDs, names, contacts or email addresses. It fetches only aggregate counts for all 36 districts.

## One-time activation (Google account that can read the MLVM Sheet)

1. Open https://script.google.com/home/projects/create in that Google account.
2. Name the Apps Script project **MLVM Public Dashboard Live API**.
3. Replace the default `Code.gs` text with the **entire** source file [live-aggregates-api.gs](./live-aggregates-api.gs) from this folder. Save the project.
4. Choose **Deploy → New deployment → Web app**. Select **Execute as: Me**; **Who has access: Anyone**. Grant read access to the Sheet when Google prompts. This publishes only the aggregate output, not the Sheet.
5. Copy the exact new `https://script.google.com/macros/s/.../exec` URL. Visit it in a private tab: it should show JavaScript starting with `window.MLVM_LIVE_JSONP({` and aggregate keys like `totals`, `districts`, `activities`. **It must not contain names, phone numbers, emails or IDs.**
6. Edit [live-config.js](./live-config.js) to replace `''` with that **exact /exec URL**, retaining surrounding quotes, then Commit. For example: `window.MLVM_PUBLIC_STATS_API = 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec';`
7. Open [the public dashboard](https://catonpe-droid.github.io/Dalalnama/MLVMData/dashboard/). The top bar should say **LIVE • दर मिनिटाला अपडेट**. Counts, charts, the map, and downloadable CSV are rebuilt from the latest aggregate API response every 60 seconds while visible, and when returning to the browser tab.

The read-only API caches aggregates for 30 seconds to protect Sheet performance. On API failure, the dashboard clearly displays a fallback/stale status rather than claiming the snapshot is live.

## Important

- Updating a `.gs` file in GitHub does **not** deploy Google Apps Script. Steps 1–6 must be completed once to activate the connection.
- The `dashboard/data.json` snapshot is a **fallback**, not the permanent live data source.
- To change server-side calculations in the future, edit the Apps Script project code and deploy a **new version**. GitHub changes alone do not update an existing Apps Script deployment.
- Verification statuses are read from column M of the private Sheet; `प्राप्त` is **not** treated as verified.
- `villages` is the sum of self-reported organization coverage, which can include overlapping villages.
