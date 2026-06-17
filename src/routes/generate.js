const express = require('express');
const paperService = require('../services/paperService');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const paper = await paperService.generatePaper(req.body);
    res.status(201).json(paper);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
