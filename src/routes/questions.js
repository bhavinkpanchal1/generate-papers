const express = require('express');
const questionService = require('../services/questionService');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const questions = await questionService.createQuestions(req.body);
    res.status(201).json({ questions });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const questions = await questionService.listQuestions(req.query);
    res.json({ questions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
