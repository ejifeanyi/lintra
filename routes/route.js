const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const { protect, admin } = require("../middleware/auth");
const { check } = require("express-validator");

// Health check endpoint
router.get("/", (req, res) => {
	res.send("Server is up and running.");
});

// Auth routes
router.post("/api/auth", authController.verifyToken);

// User routes
router.post(
	"/api/users/register",
	[
		check("firstname", "Firstname is required").not().isEmpty(),
		check("email", "Please include a valid email").isEmail(),
		check("password", "Password must be at least 6 characters").isLength({
			min: 6,
		}),
	],
	userController.registerUser
);
router.post("/api/users/login", userController.authUser);
router.get("/api/users/user", protect, userController.getUserByToken);


module.exports = router;
