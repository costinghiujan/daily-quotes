import { body, param, query } from 'express-validator';

export const createQuoteSchema = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Textul citatului este obligatoriu')
    .isLength({ max: 1000 })
    .withMessage('Textul citatului nu poate depăși 1000 de caractere')
    .escape(),
  body('author')
    .trim()
    .notEmpty()
    .withMessage('Autorul citatului este obligatoriu')
    .isLength({ max: 200 })
    .withMessage('Numele autorului nu poate depăși 200 de caractere')
    .escape(),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Categoria nu poate depăși 100 de caractere')
    .escape(),
];

export const moodSearchSchema = [
  body('mood')
    .trim()
    .notEmpty()
    .withMessage('Mood-ul este obligatoriu')
    .isLength({ max: 200 })
    .withMessage('Mood-ul nu poate depăși 200 de caractere')
    .escape(),
];

export const getQuotesSchema = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pagina trebuie să fie un număr întreg pozitiv'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limita trebuie să fie între 1 și 100'),
];

export const quoteIdSchema = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID-ul citatului trebuie să fie un număr întreg pozitiv'),
];
