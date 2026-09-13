# Draft questions

Files here come from `npm run content:ingest -- <file.pdf> [--slug name] [--answers "1:B,2:D"]`, which reads a contest PDF's text layer and splits it into numbered problems. The app never loads this folder.

Each draft has the prompt, lettered choices, an estimated band from the problem number (Math Kangaroo sections: 1 to 8, 9 to 16, 17 to 24), `needsDiagram` when the text refers to a picture, and `correctIndex` when an answer key was given.

To turn a draft into a real question:
1. Check the prompt and choices against the PDF; scanned PDFs without a text layer produce nothing and need typing or OCR.
2. Add skills from `content/skills.json`, the answer, an explanation a 5-year-old can follow, and a visual if `needsDiagram` is true (draw it as SVG; do not copy contest artwork).
3. Put it in a file under `content/questions/` with `"reviewStatus": "draft"` and register the file in `src/content/bank.ts`.
4. Run an independent blind solve (someone or an agent answering without the key). Only when it agrees, set `"reviewed"` and log the round in `content/REVIEW.md`.

Copyright: Math Kangaroo and AMC problems are copyrighted. Keep imported contest questions for private home use in this signed-in app only.
