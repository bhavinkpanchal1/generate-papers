const questionRepository = require('../repositories/questionRepository');
const paperRepository = require('../repositories/paperRepository');
const { SUBJECTS, DIFFICULTIES } = require('./questionService');

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function pickByRatio(questions, difficultyRatio, total) {
  const selected = [];
  const grouped = questions.reduce((acc, question) => {
    acc[question.difficulty] = acc[question.difficulty] || [];
    acc[question.difficulty].push(question);
    return acc;
  }, {});

  Object.keys(difficultyRatio).forEach(difficulty => {
    const count = Math.floor(total * Number(difficultyRatio[difficulty]));
    selected.push(...shuffle(grouped[difficulty] || []).slice(0, count));
  });

  const remaining = shuffle(questions.filter(question => !selected.some(item => item.id === question.id)));
  return [...selected, ...remaining].slice(0, total);
}

function validateGenerateInput(input) {
  const errors = [];

  if (!SUBJECTS.has(input.subject)) {
    errors.push('subject must be Math, Physics, or Chemistry');
  }

  if (!Array.isArray(input.chapters) || input.chapters.length === 0) {
    errors.push('chapters must be a non-empty array');
  }

  if (!Number.isInteger(Number(input.number_of_questions)) || Number(input.number_of_questions) < 1) {
    errors.push('number_of_questions must be at least 1');
  }

  if (input.difficulty_ratio && typeof input.difficulty_ratio !== 'object') {
    errors.push('difficulty_ratio must be an object');
  }

  Object.keys(input.difficulty_ratio || {}).forEach(difficulty => {
    if (!DIFFICULTIES.has(difficulty)) {
      errors.push(`difficulty_ratio.${difficulty} is not supported`);
    }
  });

  if (errors.length > 0) {
    const error = new Error('Invalid generate payload');
    error.status = 400;
    error.details = errors;
    throw error;
  }
}

async function generatePaper(input) {
  validateGenerateInput(input);

  const numberOfQuestions = Number(input.number_of_questions);
  const candidates = await questionRepository.findAll({
    subject: input.subject,
    chapters: input.chapters
  });

  const selected = input.difficulty_ratio
    ? pickByRatio(candidates, input.difficulty_ratio, numberOfQuestions)
    : shuffle(candidates).slice(0, numberOfQuestions);

  if (selected.length < numberOfQuestions) {
    const error = new Error('Not enough questions match the requested filters');
    error.status = 400;
    error.details = {
      requested: numberOfQuestions,
      available: selected.length
    };
    throw error;
  }

  return paperRepository.create({
    subject: input.subject,
    chapters: input.chapters,
    difficulty_ratio: input.difficulty_ratio || {},
    number_of_questions: numberOfQuestions,
    questions: selected
  });
}

async function getPaper(id) {
  const paper = await paperRepository.findById(id);

  if (!paper) {
    const error = new Error('Paper not found');
    error.status = 404;
    throw error;
  }

  return paper;
}

module.exports = {
  generatePaper,
  getPaper
};
