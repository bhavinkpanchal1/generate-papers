const questionRepository = require('../repositories/questionRepository');

const SUBJECTS = new Set(['Math', 'Physics', 'Chemistry']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

function isPresent(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeQuestion(input) {
  return {
    subject: input.subject && input.subject.trim(),
    chapter: input.chapter && input.chapter.trim(),
    difficulty: input.difficulty && input.difficulty.trim().toLowerCase(),
    question_html: input.question_html && input.question_html.trim(),
    question_latex: input.question_latex ? input.question_latex.trim() : null,
    answer: input.answer ? input.answer.trim() : null,
    marks: Number.isInteger(Number(input.marks)) ? Number(input.marks) : 1,
    source_file: input.source_file ? input.source_file.trim() : null
  };
}

function validateQuestion(question, index) {
  const prefix = `questions[${index}]`;

  if (!SUBJECTS.has(question.subject)) {
    return `${prefix}.subject must be Math, Physics, or Chemistry`;
  }

  if (!isPresent(question.chapter)) {
    return `${prefix}.chapter is required`;
  }

  if (!DIFFICULTIES.has(question.difficulty)) {
    return `${prefix}.difficulty must be easy, medium, or hard`;
  }

  if (!isPresent(question.question_html)) {
    return `${prefix}.question_html is required`;
  }

  if (question.marks < 1) {
    return `${prefix}.marks must be at least 1`;
  }

  return null;
}

async function createQuestions(payload) {
  const input = Array.isArray(payload.questions) ? payload.questions : [payload];
  const questions = input.map(normalizeQuestion);
  const errors = questions.map(validateQuestion).filter(Boolean);

  if (errors.length > 0) {
    const error = new Error('Invalid question payload');
    error.status = 400;
    error.details = errors;
    throw error;
  }

  return questionRepository.createMany(questions);
}

async function listQuestions(query) {
  const filters = {
    subject: query.subject,
    chapter: query.chapter,
    difficulty: query.difficulty ? query.difficulty.toLowerCase() : undefined
  };

  if (query.chapters) {
    filters.chapters = String(query.chapters)
      .split(',')
      .map(chapter => chapter.trim())
      .filter(Boolean);
  }

  return questionRepository.findAll(filters);
}

module.exports = {
  createQuestions,
  listQuestions,
  SUBJECTS,
  DIFFICULTIES
};
