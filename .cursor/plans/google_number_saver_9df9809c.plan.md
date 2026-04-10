---
name: Google Number Saver
overview: Build a React web app called "google-number-saver" that lets users upload an Excel spreadsheet containing phone numbers (and optionally names), automatically detects and extracts them, generates a Google Contacts-compatible CSV with a sequential naming convention (A00001, A00002...), and includes an embedded tutorial video on how to import into Google Contacts.
todos:
  - id: scaffold
    content: Scaffold Vite + React + TS project; install SheetJS (CDN tarball), libphonenumber-js, Tailwind v4, react-dropzone, motion, sonner, jszip; configure Tailwind
    status: completed
  - id: constants
    content: Define exact Google Contacts CSV header row in constants.ts, verify column count matches real export
    status: completed
  - id: layout-stepper
    content: Build App shell with compact header, 3-step wizard stepper (Upload > Review > Download), dark mode toggle, step transitions with Motion
    status: completed
  - id: step1-upload
    content: "Build Step 1: react-dropzone upload zone with animated drag states, file validation (.xlsx/.xls/.csv), sample file download link"
    status: completed
  - id: parse-engine
    content: Implement parseExcel.ts (SheetJS raw mode), phoneUtils.ts (validation + leading-zero restore + country formatting), detectColumns.ts (auto-detect phone/name columns by scoring)
    status: completed
  - id: step2-review
    content: "Build Step 2: editable preview table with inline cell editing, column selector dropdowns, country code selector, row delete/select checkboxes, validation warnings, live selected count"
    status: completed
  - id: csv-generation
    content: "Implement generateCsv.ts: exact Google header row (no BOM), A00001--Name convention, 3000-row auto-split with JSZip, browser download trigger"
    status: completed
  - id: step3-download
    content: "Build Step 3: summary stats, download button with checkmark animation, success toast, embedded YouTube video (how to import into Google Contacts)"
    status: completed
  - id: polish
    content: Dark mode, sessionStorage persistence with restore prompt, sonner toasts throughout, mobile responsiveness, reduced motion support, accessibility audit
    status: completed
isProject: false
---

# Google Number Saver - Project Plan

## Audit: Issues Found in Original Plan and Fixes Applied

### Issue 1 -- CRITICAL: Wrong CSV header names (would cause silent data loss)npm

Google Contacts has **two different header formats** depending on context:

- **Google Sheets template (for import):** uses `First Name`, `Last Name`, `Phone 1 - Value`, `Phone 1 - Type`, `Labels`
- **Google CSV export:** uses `Given Name`, `Family Name`, `Phone 1 - Value`, `Phone 1 - Type`, `Group Membership`

Both work for import, but the original plan mixed terminology. The **safest approach** is to use the **export format** (the one you get when you export from Google Contacts), because it is the most widely tested and documented across Stack Overflow and official sources.

**Fix:** Use the exact header row from a real Google Contacts export. The verified header is:

```
Name,Given Name,Additional Name,Family Name,Yomi Name,Given Name Yomi,Additional Name Yomi,Family Name Yomi,Name Prefix,Name Suffix,Initials,Nickname,Short Name,Maiden Name,Birthday,Gender,Location,Billing Information,Directory Server,Mileage,Occupation,Hobby,Sensitivity,Priority,Subject,Notes,Language,Photo,Group Membership,E-mail 1 - Type,E-mail 1 - Value,Phone 1 - Type,Phone 1 - Value
```

### Issue 2 -- CRITICAL: UTF-8 BOM will cause first header to be unreadable

The original plan says "UTF-8 encoding with BOM for Excel compatibility." This is **wrong for Google Contacts import**. Google Contacts expects plain UTF-8 **without BOM**. If you add a BOM (`EF BB BF`), the first header `Name` becomes `\uFEFFName` and Google won't recognize it -- all name data silently goes to notes or is dropped.

**Fix:** Generate plain UTF-8 CSV with **no BOM**. The BOM advice applies to CSVs meant to be opened in Excel, not for Google import.

### Issue 3 -- MEDIUM: SheetJS `xlsx` package installation

SheetJS (the `xlsx` npm package) is no longer published to the npm registry under that name in recent versions. The current official install method is from their CDN tarball.

**Fix:** Install via `npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` instead of `npm i xlsx`.

### Issue 4 -- MEDIUM: Phone number column in Excel often stored as number type

Excel frequently stores phone numbers as numeric values, stripping leading zeros (e.g., `0831234567` becomes `831234567`). SheetJS will parse these as JavaScript numbers, not strings.

**Fix:** When parsing, use `raw: true` option in `sheet_to_json` and explicitly handle numeric cells. Also detect and restore leading zeros by checking digit count against expected phone number length for the locale.

### Issue 5 -- LOW: Missing `.csv` file also accepted in upload

Users might try to upload a `.csv` file directly. The original plan only accepts `.xlsx`/`.xls`.

**Fix:** Also accept `.csv` uploads and parse them with SheetJS (which supports CSV). This covers edge cases where users already have data in CSV format.

### Issue 6 -- LOW: 3,000 row Google import limit not handled

Google Contacts rejects imports over 3,000 rows. The original plan doesn't address this.

**Fix:** If the Excel file has more than 3,000 phone numbers, automatically split the output into multiple CSV files (e.g., `contacts_part1.csv`, `contacts_part2.csv`) and download as a `.zip` using JSZip, or warn the user and let them choose a range.

### Issue 7 -- DESIGN: "Group Membership" value format

The value must be `* myContacts` (asterisk + space + name). Without the `*`  prefix, Google ignores group assignment and the contact may not appear in the main list.

**Fix:** Already correct in the original plan, but now explicitly documented to never omit the `*`  prefix.

---

## Overview

A single-page React web app where a user uploads an Excel file (.xlsx/.xls/.csv), the app parses phone numbers (with optional names), and outputs a Google Contacts CSV ready for import. Contacts are named sequentially (e.g., `A00001--John`, `A00002--Jane`) so they sort to the top of the contact list alphabetically.

---

## Tech Stack

- **Framework:** React 18+ with TypeScript (via Vite for fast builds)
- **Styling:** Tailwind CSS v4 for a modern, responsive UI
- **Excel Parsing:** SheetJS (`xlsx` v0.20.3 from CDN tarball) -- client-side, no server needed
- **Phone Detection:** regex-based extraction + `libphonenumber-js` for validation/formatting
- **CSV Generation:** manual string builder (Google CSV has a specific header format, no BOM)
- **Multi-file support:** JSZip for splitting output when rows exceed 3,000
- **Hosting-ready:** fully static -- can be deployed to Vercel, Netlify, or GitHub Pages

No backend is required. All processing happens in the browser.

---

## Google Contacts CSV Format (Verified)

The output CSV must use the **exact header row from a Google Contacts export** (case-sensitive, order matters). The full verified header:

```
Name,Given Name,Additional Name,Family Name,Yomi Name,Given Name Yomi,Additional Name Yomi,Family Name Yomi,Name Prefix,Name Suffix,Initials,Nickname,Short Name,Maiden Name,Birthday,Gender,Location,Billing Information,Directory Server,Mileage,Occupation,Hobby,Sensitivity,Priority,Subject,Notes,Language,Photo,Group Membership,E-mail 1 - Type,E-mail 1 - Value,Phone 1 - Type,Phone 1 - Value
```

The columns we populate per row:

- `Name` -- `A00001--John` (display name, controls sort order)
- `Given Name` -- the actual first name from the Excel sheet (or blank)
- `Family Name` -- the actual last name (or blank)
- `Phone 1 - Type` -- `Mobile`
- `Phone 1 - Value` -- the extracted phone number with country code (e.g., `+27831234567`)
- `Group Membership` -- `* myContacts` (the `*`  prefix is mandatory)

All other columns are present but empty. Encoding: **plain UTF-8, no BOM**.

---

## Naming Convention: `A00001--Name`

- The `Name` field (what Google displays and sorts by) will be: `**A00001--ContactName`**
- The prefix `A` ensures contacts sort at the very top of the alphabetical list
- The zero-padded number (`00001`) keeps ordering consistent up to 99,999 contacts
- The `--` separator visually distinguishes the ID from the actual name
- If no name is provided in the Excel sheet, the format is just `A00001`
- The sequential counter increments per row: `A00001`, `A00002`, `A00003`...

---

## App Pages / Sections (Single Page)

### 1. Hero / Landing Section

- App title "Google Number Saver"
- Brief tagline: "Upload your Excel sheet, get a Google Contacts CSV in seconds"
- Call-to-action button scrolling to the upload section
- Clean, modern Google-inspired design (white background, blue accents, card-based layout)

### 2. How-To Video Section

- Embedded YouTube video tutorial showing how to import CSV into Google Contacts (use [this video](https://www.youtube.com/watch?v=oiBRc3HvCao) as the embed -- it's a 2025 tutorial on exactly this workflow)
- Step-by-step text instructions alongside the video:
  1. Download the CSV from this app
  2. Go to [contacts.google.com](https://contacts.google.com)
  3. Click "Import" on the left sidebar (or Menu > Import on mobile)
  4. Click "Select file" and choose the downloaded CSV
  5. Click "Import" -- your contacts will appear immediately

### 3. Upload & Convert Section

- Drag-and-drop zone (also click-to-browse) accepting `.xlsx`, `.xls`, and `.csv` files
- On upload:
  - Parse the Excel file client-side with SheetJS (using `raw: true` to preserve phone number formatting)
  - Display a **preview table** showing detected columns (Name, Phone Number)
  - Let the user **select which column** contains phone numbers and which contains names (auto-detect first, but allow override via dropdowns)
  - Show count of valid phone numbers found
  - Warn if any phone numbers look invalid (too few/many digits)
- **"Convert & Download"** button that:
  - Generates the Google Contacts CSV with the `A00001--Name` convention
  - If over 3,000 contacts: splits into multiple CSVs and downloads as a `.zip`
  - If 3,000 or fewer: triggers a direct `.csv` download
  - File is named `google-contacts-import.csv`

### 4. Footer

- Brief credits, link to GitHub repo

---

## Core Logic: Phone Number Detection

1. Parse the first sheet of the uploaded file (most common case; allow sheet selection if multiple)
2. Handle Excel's numeric storage: phone numbers stored as numbers lose leading zeros -- detect this and restore based on expected digit count
3. For each column, score how many cells look like phone numbers using:
  - Regex pattern: cells containing mostly digits, spaces, dashes, parentheses, plus signs, with 7-15 digit length
  - `libphonenumber-js` `parsePhoneNumber()` as validation (not just `isValidPhoneNumber` which is too strict for raw input)
4. Auto-select the column with the highest phone-number score
5. Similarly detect a "name" column by looking for text-heavy columns (string cells with alphabetic characters, not numbers)
6. Allow the user to manually override column selection via dropdowns

---

## CSV Generation Logic

Exact output format (every comma matters):

```
Name,Given Name,Additional Name,Family Name,Yomi Name,Given Name Yomi,Additional Name Yomi,Family Name Yomi,Name Prefix,Name Suffix,Initials,Nickname,Short Name,Maiden Name,Birthday,Gender,Location,Billing Information,Directory Server,Mileage,Occupation,Hobby,Sensitivity,Priority,Subject,Notes,Language,Photo,Group Membership,E-mail 1 - Type,E-mail 1 - Value,Phone 1 - Type,Phone 1 - Value
A00001--John,John,,,,,,,,,,,,,,,,,,,,,,,,,,,* myContacts,,,Mobile,+27831234567
A00002--Jane,Jane,,,,,,,,,,,,,,,,,,,,,,,,,,,* myContacts,,,Mobile,+27829876543
```

Key rules:

- Use the exact Google Contacts export header row (33 columns in our minimal version)
- Every row must have exactly the same number of commas as the header
- Only populate: `Name`, `Given Name`, `Phone 1 - Type`, `Phone 1 - Value`, `Group Membership`
- All other fields are empty strings (represented as consecutive commas)
- Encoding: **plain UTF-8, NO BOM** (BOM breaks Google import)
- Values containing commas or quotes must be wrapped in double quotes with internal quotes escaped as `""`
- If more than 3,000 rows, split into multiple files

---

## File Structure

```
google-number-saver/
  public/
    favicon.svg
  src/
    components/
      Hero.tsx           -- landing section with title + CTA
      VideoTutorial.tsx  -- embedded video + step-by-step text
      FileUploader.tsx   -- drag-and-drop upload zone
      DataPreview.tsx    -- preview table + column selector
      DownloadButton.tsx -- convert + download trigger
      Footer.tsx
    utils/
      parseExcel.ts      -- SheetJS parsing logic (raw mode for phone numbers)
      detectColumns.ts   -- auto-detect phone/name columns via scoring
      generateCsv.ts     -- Google Contacts CSV builder (no BOM, exact headers)
      phoneUtils.ts      -- phone number validation/formatting/leading zero restore
      constants.ts       -- Google CSV header row, column indices
    App.tsx
    main.tsx
    index.css            -- Tailwind imports
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  README.md
```

---

## Implementation Order

1. **Project scaffolding** -- `npm create vite@latest` with React + TypeScript, install SheetJS from CDN tarball, libphonenumber-js, Tailwind CSS v4, JSZip, react-dropzone, motion, sonner
2. **Constants + CSV header** -- Define the exact Google Contacts header row in `constants.ts`, verify column count
3. **Layout + Stepper** -- App shell with 3-step wizard (Upload > Review > Download), compact header, stepper progress bar
4. **Step 1: Upload** -- react-dropzone with animated drag states, file validation (.xlsx/.xls/.csv), sample file download link
5. **Step 2: Review** -- Preview table with inline editing, column selector dropdowns, country code selector, row delete/select, validation warnings
6. **Step 3: Download** -- Summary stats, download with success animation, embedded YouTube video ("What's Next"), confetti/checkmark moment
7. **Excel parsing engine** -- SheetJS with `raw: true`, phone number detection with leading-zero restoration, column auto-detection, country-aware formatting
8. **CSV generation + download** -- Build Google-format CSV (no BOM), handle 3,000-row limit with auto-split, trigger browser download
9. **Polish** -- Dark mode, session persistence, micro-animations (Motion), toast notifications (Sonner), mobile responsiveness, reduced motion support, accessibility

---

## Expert Suggestions Applied

### Suggestion 1: 3-Step Wizard Instead of Long Scroll Page

**Problem:** A single long-scroll page with Hero > Video > Upload > Preview > Download creates cognitive overload. The user has to mentally track where they are.

**Fix:** Replace with a **3-step wizard/stepper**:

- **Step 1: Upload** -- Drag-and-drop zone, file validation, sheet selection
- **Step 2: Review** -- Preview table, column mapping, inline editing, validation warnings
- **Step 3: Download** -- Summary stats, download button, embedded video ("What's next: how to import into Google Contacts")

A horizontal stepper bar at the top shows progress: `Upload -> Review -> Download`. The video moves to Step 3 where it has maximum impact -- the user just got their file and needs to know the next step. The Hero becomes a compact header (not a full landing page).

### Suggestion 2: `react-dropzone` for the Upload Zone

**Problem:** Building drag-and-drop from scratch is error-prone across browsers and devices.

**Fix:** Use `react-dropzone` (~5M weekly downloads, ~12KB, headless). It handles cross-browser drag events, click-to-browse on mobile, file type validation, and ARIA attributes. We build our own styled UI on top.

### Suggestion 3: Micro-Animations with Motion

**Problem:** A static page with no transitions feels dated for a 2026 web app.

**Fix:** Add `motion` (formerly Framer Motion) for:

- Step transitions: fade + slide between wizard steps via `AnimatePresence`
- Dropzone: scale/glow pulse when dragging a file over
- Preview table rows: stagger-animate as they appear
- Download button: checkmark bounce animation on completion
- All durations 160-400ms, only `transform` + `opacity` (GPU-accelerated)
- Respect `prefers-reduced-motion` via `useReducedMotion()` hook

### Suggestion 4: Toast Notifications with Sonner

**Problem:** Silent success/failure leaves users confused.

**Fix:** Use `sonner` (~3KB, zero deps) for contextual feedback:

- Success: "12 contacts exported to google-contacts-import.csv"
- Warning: "3 phone numbers were invalid and skipped"
- Error: "Could not parse file. Please upload a valid Excel file."
- Info: "4,500 contacts detected -- will split into 2 CSV files"

### Suggestion 5: Editable Preview Table

**Problem:** Read-only preview forces users back to Excel to fix mistakes.

**Fix:** Make the preview table interactive:

- Click a cell to edit inline (phone or name)
- Delete button per row to exclude bad entries
- Select All / Deselect checkbox for bulk control
- Live count: "47 of 52 contacts selected for export"

### Suggestion 6: Sample File Download

**Problem:** Users don't know what format their Excel file should be in.

**Fix:** Provide a "Download sample file" link in Step 1 with a tiny `.xlsx` containing 3 example rows (Name + Phone Number). Sets expectations and doubles as a test file.

### Suggestion 7: Country Code Selector

**Problem:** Phone numbers like `0831234567` are ambiguous without knowing the country.

**Fix:** Add a country dropdown (with flag icons) in Step 2 that:

- Defaults to user's locale via `navigator.language`
- Uses `libphonenumber-js` to parse/format numbers for that country
- Shows formatted international number in preview (e.g., `+27 83 123 4567`)
- Warns if a number doesn't match the selected country

### Suggestion 8: Dark Mode

**Fix:** Tailwind `dark:` variant with `class` strategy. Detect system preference, add toggle in header, persist in `localStorage`.

### Suggestion 9: Session Persistence

**Problem:** Accidental page refresh loses all parsed data.

**Fix:** Store parsed data in `sessionStorage` after Step 1. On reload, offer: "You have a previous session with 47 contacts. Resume or start fresh?"

### Suggestion 10: Success Moment at Download

**Fix:** When download triggers:

1. Checkmark animation (Motion: scale from 0 with bounce spring)
2. Success toast via Sonner
3. Auto-advance to "What's Next" card with the embedded YouTube video
4. This is where the tutorial video has maximum user impact

---

## Updated Dependency List

```bash
npm create vite@latest google-number-saver -- --template react-ts
cd google-number-saver
npm install
npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
npm i libphonenumber-js react-dropzone motion sonner jszip
npm i -D tailwindcss @tailwindcss/vite
```

Estimated bundle impact (tree-shaken, gzipped):

- SheetJS: ~90KB (necessary, no lighter alternative)
- libphonenumber-js: ~45KB (using `min` metadata build)
- react-dropzone: ~12KB
- motion: ~15-20KB (basic animations only)
- sonner: ~3KB
- jszip: ~10KB (dynamic import, only loaded when splitting)
- **Total: ~175-180KB** on top of React + Vite baseline

