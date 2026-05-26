import { body } from 'express-validator';

export const registerSchema = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username-ul este obligatoriu')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username-ul trebuie să aibă între 3 și 30 de caractere')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username-ul poate conține doar litere, cifre și underscore')
    .escape(),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email-ul este obligatoriu')
    .isEmail()
    .withMessage('Email-ul nu este valid')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Parola este obligatorie')
    .isLength({ min: 8 })
    .withMessage('Parola trebuie să aibă cel puțin 8 caractere')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Parola trebuie să conțină cel puțin o literă mare, o literă mică și o cifră'),
  body('full_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Numele complet nu poate depăși 100 de caractere')
    .escape(),
];

export const loginSchema = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email-ul este obligatoriu')
    .isEmail()
    .withMessage('Email-ul nu este valid')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Parola este obligatorie'),
];
