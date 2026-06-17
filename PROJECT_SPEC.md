# Entrance Exam Question Paper Generator (MVP)

## Goal

Build a web application for teachers to import exam PDFs, store questions, and generate question papers.

Target users:
Teachers creating entrance exam papers.

Deadline:
MVP in 1 day.

---

## Tech Stack

Frontend:

* React
* TypeScript
* Tailwind
* React Router
* Axios
* KaTeX

Backend:

* Node.js
* Express
* SQLite

Storage:

* SQLite database

Export:

* DOCX

---

## Features

### 1. Import Questions

Teacher uploads PDF.

System should:

* Detect if PDF contains selectable text
* If text exists → extract using pdf-parse
* Otherwise:

  * Convert pages to images
  * Run OCR using tesseract.js

After extraction:

Show editable preview.

Teacher can:

* Edit
* Delete
* Approve

Save approved questions.

---

### 2. Question Storage

Store:

Question:

* id
* subject
* chapter
* difficulty
* question_html
* question_latex
* answer
* marks
* source_file
* created_at

Subjects:

* Math
* Physics
* Chemistry

---

### 3. Generate Paper

Inputs:

* Subject
* Chapters
* Difficulty ratio
* Number of questions

Logic:

* Filter DB
* Shuffle
* Return selected questions

---

### 4. Preview

Render:

* Text
* KaTeX equations

Buttons:

* Generate
* Print
* Export DOCX

---

## Pages

/pages

* ImportQuestions
* QuestionBank
* GeneratePaper
* PreviewPaper

---

## Backend Routes

POST /upload
POST /questions
GET /questions
POST /generate
GET /paper/:id

---

## Constraints

* No authentication
* No AI generation
* Keep architecture simple
* Mobile responsive
* Clean TypeScript
* Components <200 lines
* Use service layer
* Use repository pattern

---

## Deliverables

Phase 1:
Project scaffold

Phase 2:
Backend APIs

Phase 3:
Frontend pages

Phase 4:
Integration

Phase 5:
DOCX export
