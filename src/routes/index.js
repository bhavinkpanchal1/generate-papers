const express = require('express');
const router = express.Router();

const questions = require('./questions');
const upload = require('./upload');
const generate = require('./generate');
const papers = require('./papers');

router.use('/upload', upload);
router.use('/questions', questions);
router.use('/generate', generate);
router.use('/paper', papers);

module.exports = router;
