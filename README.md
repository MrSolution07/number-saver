# Google Number Saver

Convert Excel/CSV contact sheets into a Google Contacts-compatible CSV in seconds.

`Google Number Saver` is a React + TypeScript web app that helps users avoid manually typing phone numbers. Upload a spreadsheet, review detected contacts, and download a ready-to-import Google CSV file.

---

## Features

- Upload `.xlsx`, `.xls`, or `.csv` files (drag-and-drop or file picker)
- Auto-detect phone and name columns with manual override controls
- Parse and normalize phone numbers with country-aware formatting
- Inline editing and row-level selection before export
- Google Contacts CSV generation with exact compatible headers
- Automatic split into multiple files when contacts exceed Google import limits (3,000 per file)
- ZIP download for multi-file exports
- 3-step UX flow: **Upload -> Review -> Download**
- Dark mode support
- Embedded tutorial video for importing into Google Contacts

---

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS v4
- **Spreadsheet Parsing:** SheetJS (`xlsx`)
- **Phone Parsing/Validation:** `libphonenumber-js`
- **Upload UX:** `react-dropzone`
- **Animations:** `motion`
- **Toasts:** `sonner`
- **ZIP Generation:** `jszip`

---

## Project Structure

```text
src/
  components/
    Header.tsx
    Footer.tsx
    StepUpload.tsx
    StepReview.tsx
    StepDownload.tsx
  utils/
    constants.ts
    parseExcel.ts
    detectColumns.ts
    phoneUtils.ts
    generateCsv.ts
    sampleFile.ts
  types/
    index.ts
  App.tsx
  main.tsx
  index.css
```

---

## How It Works

1. **Upload**  
   User uploads an Excel/CSV file. The app parses rows client-side (no backend required).

2. **Review**  
   The app auto-detects likely phone/name columns, formats phone numbers, and displays an editable preview.

3. **Download**  
   The app generates a Google Contacts CSV (plain UTF-8, no BOM).  
   If rows exceed 3,000, output is split and downloaded as a ZIP archive.

---

## Google Contacts Compatibility

This app uses the Google Contacts CSV export-style header format and writes:

- `Name` as sequential sortable value (e.g. `A00001--John Doe`)
- `Given Name`
- `Phone 1 - Type` (`Mobile`)
- `Phone 1 - Value`
- `Group Membership` (`* myContacts`)

Important:

- CSV is generated as **UTF-8 without BOM**
- Header names are case-sensitive and order-sensitive for reliable import behavior

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm 9+

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## Deployment

This is a static frontend app and can be deployed to:

- Vercel
- Netlify
- GitHub Pages
- Any static hosting provider

Build output is generated in the `dist/` folder.

---

## Privacy

All processing happens in the browser. No spreadsheet data is sent to a backend by this project.

---

## Repository

GitHub: [MrSolution07/number-saver](https://github.com/MrSolution07/number-saver)

