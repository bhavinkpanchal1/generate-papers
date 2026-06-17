const pdfParse = require('pdf-parse');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const OCR_DPI = 250;

function normalizeOcrText(text) {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (!line) return true;
      if (/^MHT-?CET\s+20\d{2}\s+Question\s+Paper/i.test(line)) return false;
      if (/^\d{1,2}\s+[A-Z][a-z]+\s+20\d{2}\s*\(Shift/i.test(line)) return false;
      if (/^Page\s+\d+$/i.test(line)) return false;
      if (/^\d+$/.test(line)) return false;
      return true;
    });

  return lines
    .filter((line, index) => {
      if (!/^\d{1,3}\s*[\).,;:-]\s*$/.test(line)) return true;

      const nextTextLine = lines.slice(index + 1).find(candidate => candidate.length > 0);
      return !nextTextLine || !/^\d{1,3}\s*[\).,;:-]\s*$/.test(nextTextLine);
    })
    .join('\n')
    .replace(/(^|\n)\s*(\d{1,3})\s*[,;]\s*(?=\n)/g, '$1$2.\n')
    .replace(/(^|\n)\s*(\d{1,3})\s*[,;]\s+/g, '$1$2. ')
    .replace(/(^|\n)\s*(\d{1,3})\s*[\).:-]\s*\n+/g, '$1$2. ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitIntoQuestionBlocks(text) {
  const normalized = normalizeOcrText(text);
  const firstQuestionIndex = normalized.search(/(?:^|\n)\s*(?:Q\.?\s*)?\d+[\).:-]\s*/i);
  const questionText = firstQuestionIndex > 0 ? normalized.slice(firstQuestionIndex) : normalized;

  return questionText
    .replace(/\r/g, '')
    .split(/\n(?=\s*(?:Q\.?\s*)?\d+[\).:-]\s*)/i)
    .map(block => block.trim())
    .filter(Boolean);
}

function textToQuestions(text, sourceFile) {
  const blocks = splitIntoQuestionBlocks(text);

  return blocks.map(block => ({
    question_html: block.replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>'),
    question_latex: '',
    answer: '',
    source_file: sourceFile
  }));
}

async function convertPdfToImages(pdfPath, outputPrefix) {
  await execFileAsync('pdftoppm', ['-png', '-r', String(OCR_DPI), pdfPath, outputPrefix]);

  const directory = path.dirname(outputPrefix);
  const baseName = path.basename(outputPrefix);
  const files = await fs.readdir(directory);

  return files
    .filter(fileName => fileName.startsWith(baseName) && fileName.endsWith('.png'))
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
    .map(fileName => path.join(directory, fileName));
}

async function getPdfPageSize(pdfPath) {
  const { stdout } = await execFileAsync('pdfinfo', [pdfPath]);
  const match = stdout.match(/Page(?:\s+\d+)?\s+size:\s+([\d.]+)\s+x\s+([\d.]+)\s+pts/i);

  if (!match) {
    return null;
  }

  return {
    width: Math.round((Number(match[1]) / 72) * OCR_DPI),
    height: Math.round((Number(match[2]) / 72) * OCR_DPI)
  };
}

async function getPngSize(imagePath) {
  const { stdout } = await execFileAsync('file', ['-b', imagePath]);
  const match = stdout.match(/PNG image data,\s+(\d+)\s+x\s+(\d+)/i);

  if (!match) {
    const error = new Error('Could not read rendered page size for column OCR');
    error.status = 422;
    error.details = { file_output: stdout.trim() };
    throw error;
  }

  return {
    width: Number(match[1]),
    height: Number(match[2])
  };
}

function getColumnRectangles(pageSize) {
  const gutter = Math.round(pageSize.width * 0.035);
  const sideMargin = Math.round(pageSize.width * 0.025);
  const topMargin = Math.round(pageSize.height * 0.015);
  const bottomMargin = Math.round(pageSize.height * 0.02);
  const halfWidth = Math.floor(pageSize.width / 2);
  const usableHeight = pageSize.height - topMargin - bottomMargin;

  return [
    {
      left: sideMargin,
      top: topMargin,
      width: halfWidth - sideMargin - Math.floor(gutter / 2),
      height: usableHeight
    },
    {
      left: halfWidth + Math.ceil(gutter / 2),
      top: topMargin,
      width: pageSize.width - halfWidth - sideMargin - Math.ceil(gutter / 2),
      height: usableHeight
    }
  ];
}

async function extractTextWithOcr(file) {
  let createWorker;
  let PSM;
  try {
    ({ createWorker, PSM } = require('tesseract.js'));
  } catch (error) {
    const missingDependency = new Error('OCR dependency is not installed. Run npm install, then retry this scanned PDF.');
    missingDependency.status = 503;
    missingDependency.details = {
      missing_package: 'tesseract.js'
    };
    throw missingDependency;
  }

  const workingDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'paper-ocr-'));
  const pdfPath = path.join(workingDirectory, `${randomUUID()}.pdf`);
  const outputPrefix = path.join(workingDirectory, 'page');
  let worker;

  try {
    await fs.writeFile(pdfPath, file.buffer);
    const imagePaths = await convertPdfToImages(pdfPath, outputPrefix);

    if (imagePaths.length === 0) {
      const error = new Error('Could not convert PDF pages to images for OCR');
      error.status = 422;
      throw error;
    }

    const pageSize = (await getPdfPageSize(pdfPath)) || (await getPngSize(imagePaths[0]));
    const columnRectangles = getColumnRectangles(pageSize);

    worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
      preserve_interword_spaces: '1',
      user_defined_dpi: String(OCR_DPI)
    });

    const pages = [];
    for (const imagePath of imagePaths) {
      const columns = [];

      for (const rectangle of columnRectangles) {
        try {
          const result = await worker.recognize(
            imagePath,
            { rectangle },
            { text: true, blocks: false, hocr: false, tsv: false }
          );
          columns.push(result.data.text.trim());
        } catch (error) {
          const ocrError = new Error('OCR failed while reading the scanned PDF. Check network access for Tesseract language data, then retry.');
          ocrError.status = 502;
          ocrError.details = {
            extraction_method: 'tesseract.js',
            cause: error.message
          };
          throw ocrError;
        }
      }

      pages.push(columns.filter(Boolean).join('\n\n'));
    }

    return {
      text: pages.join('\n\n').trim(),
      pageCount: imagePaths.length
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
    await fs.rm(workingDirectory, { recursive: true, force: true });
  }
}

async function extractQuestionsFromPdf(file) {
  if (!file) {
    const error = new Error('PDF file is required');
    error.status = 400;
    throw error;
  }

  if (file.mimetype !== 'application/pdf') {
    const error = new Error('Only PDF uploads are supported');
    error.status = 400;
    throw error;
  }

  const parsed = await pdfParse(file.buffer);
  const text = parsed.text.trim();

  if (text) {
    return {
      source_file: file.originalname,
      extraction_method: 'pdf-parse',
      page_count: parsed.numpages,
      raw_text: text,
      questions: textToQuestions(text, file.originalname)
    };
  }

  const ocrResult = await extractTextWithOcr(file);

  if (!ocrResult.text) {
    const error = new Error('OCR completed but no readable text was found in this PDF.');
    error.status = 422;
    error.details = {
      extraction_method: 'tesseract.js'
    };
    throw error;
  }

  return {
    source_file: file.originalname,
    extraction_method: 'tesseract.js',
    page_count: ocrResult.pageCount,
    raw_text: ocrResult.text,
    questions: textToQuestions(ocrResult.text, file.originalname)
  };
}

module.exports = {
  extractQuestionsFromPdf
};
