const db = require('./index');

async function ensureSchema() {
  const hasQuestions = await db.schema.hasTable('questions');
  if (!hasQuestions) {
    await db.schema.createTable('questions', table => {
      table.increments('id').primary();
      table.string('subject').notNullable();
      table.string('chapter').notNullable();
      table.string('difficulty').notNullable();
      table.text('question_html').notNullable();
      table.text('question_latex');
      table.text('answer');
      table.integer('marks').notNullable().defaultTo(1);
      table.string('source_file');
      table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
    });
  }

  const hasPapers = await db.schema.hasTable('papers');
  if (!hasPapers) {
    await db.schema.createTable('papers', table => {
      table.increments('id').primary();
      table.string('subject').notNullable();
      table.text('chapters');
      table.text('difficulty_ratio');
      table.integer('number_of_questions').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
    });
  }

  const hasPaperQuestions = await db.schema.hasTable('paper_questions');
  if (!hasPaperQuestions) {
    await db.schema.createTable('paper_questions', table => {
      table.increments('id').primary();
      table.integer('paper_id').notNullable().references('id').inTable('papers').onDelete('CASCADE');
      table.integer('question_id').notNullable().references('id').inTable('questions').onDelete('CASCADE');
      table.integer('position').notNullable();
    });
  }
}

module.exports = { ensureSchema };
