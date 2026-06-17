const express = require('express');
const multer = require('multer');
const uploadService = require('../services/uploadService');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const result = await uploadService.extractQuestionsFromPdf(req.file);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
