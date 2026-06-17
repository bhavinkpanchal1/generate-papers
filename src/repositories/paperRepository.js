const db = require('../db');

function parseJson(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function mapPaper(row, questions = []) {
  return {
    id: row.id,
    subject: row.subject,
    chapters: parseJson(row.chapters, []),
    difficulty_ratio: parseJson(row.difficulty_ratio, {}),
    number_of_questions: row.number_of_questions,
    created_at: row.created_at,
    questions
  };
}

async function create({ subject, chapters, difficulty_ratio, number_of_questions, questions }) {
  return db.transaction(async trx => {
    const [paperId] = await trx('papers').insert({
      subject,
      chapters: JSON.stringify(chapters || []),
      difficulty_ratio: JSON.stringify(difficulty_ratio || {}),
      number_of_questions
    });

    const rows = questions.map((question, index) => ({
      paper_id: paperId,
      question_id: question.id,
      position: index + 1
    }));

    if (rows.length > 0) {
      await trx('paper_questions').insert(rows);
    }

    return findById(paperId, trx);
  });
}

async function findById(id, client = db) {
  const paper = await client('papers').where({ id }).first();
  if (!paper) return null;

  const questions = await client('paper_questions')
    .join('questions', 'paper_questions.question_id', 'questions.id')
    .where('paper_questions.paper_id', id)
    .orderBy('paper_questions.position', 'asc')
    .select(
      'questions.id',
      'questions.subject',
      'questions.chapter',
      'questions.difficulty',
      'questions.question_html',
      'questions.question_latex',
      'questions.answer',
      'questions.marks',
      'questions.source_file',
      'questions.created_at',
      'paper_questions.position'
    );

  return mapPaper(paper, questions);
}

module.exports = {
  create,
  findById
};
