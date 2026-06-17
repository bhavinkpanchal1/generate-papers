const express = require('express');
const paperService = require('../services/paperService');

const router = express.Router();

router.get('/:id', async (req, res, next) => {
  try {
    const paper = await paperService.getPaper(req.params.id);
    res.json(paper);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
