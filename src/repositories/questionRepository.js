const db = require('../db');

function mapQuestion(row) {
  return {
    id: row.id,
    subject: row.subject,
    chapter: row.chapter,
    difficulty: row.difficulty,
    question_html: row.question_html,
    question_latex: row.question_latex,
    answer: row.answer,
    marks: row.marks,
    source_file: row.source_file,
    created_at: row.created_at
  };
}

async function createMany(questions) {
  return db.transaction(async trx => {
    const created = [];

    for (const question of questions) {
      const [id] = await trx('questions').insert(question);
      const row = await trx('questions').where({ id }).first();
      created.push(mapQuestion(row));
    }

    return created;
  });
}

async function findById(id) {
  const row = await db('questions').where({ id }).first();
  return row ? mapQuestion(row) : null;
}

async function findAll(filters = {}) {
  const query = db('questions').select('*');

  if (filters.subject) {
    query.where('subject', filters.subject);
  }

  if (filters.chapter) {
    query.where('chapter', filters.chapter);
  }

  if (Array.isArray(filters.chapters) && filters.chapters.length > 0) {
    query.whereIn('chapter', filters.chapters);
  }

  if (filters.difficulty) {
    query.where('difficulty', filters.difficulty);
  }

  const rows = await query.orderBy('created_at', 'desc').orderBy('id', 'desc');
  return rows.map(mapQuestion);
}

module.exports = {
  createMany,
  findAll,
  findById
};
