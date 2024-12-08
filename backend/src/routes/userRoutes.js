import express  from 'express';
import  UserController from'../controllers/userController.js';
import  { validateRegistration, validateLogin }  from '../middleware/validationMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with the provided information
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               user_name:
 *                 type: string
 *                 description: The user's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: number
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/register', validateRegistration, UserController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', validateLogin, UserController.login);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the profile of the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *       401:
 *         description: Unauthorized access
 */
router.get('/profile', authMiddleware, (req, res) => {
    res.json({ 
      message: 'Access to protected route', 
      user: req.user 
    });
});

/**
 * @swagger
 * /api/users/google-login:
 *   post:
 *     summary: Login or register with Google
 *     description: Authenticate a user using Google credentials
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - googlePhotoUrl
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name from Google
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email from Google
 *               googlePhotoUrl:
 *                 type: string
 *                 description: URL of user's profile picture
 *     responses:
 *       200:
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       409:
 *         description: User with this email already exists
 *       500:
 *         description: Google authentication failed
 */
router.post('/google-login', UserController.googleLogin);

/**
 * @swagger
 * /api/users/link-google:
 *   post:
 *     summary: Link Google account to existing account
 *     description: Add Google account details to an existing user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - googlePhotoUrl
 *               - firebaseUid
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               googlePhotoUrl:
 *                 type: string
 *               firebaseUid:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google account linked successfully
 *       500:
 *         description: Failed to link Google account
 */
router.post('/link-google', authMiddleware, UserController.linkGoogleAccount);

export default router;