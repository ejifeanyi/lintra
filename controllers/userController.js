const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Rate limiter for login attempts
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // Limit each IP to 5 login attempts per windowMs
	message: {
		message: "Too many login attempts from this IP, please try again later.",
	},
});

// Generate JWT token
const generateToken = (id) => {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET is not defined");
	}
	return jwt.sign({ id }, secret, { expiresIn: "30d" });
};

// Register new user
exports.registerUser = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	const { firstname, email, password } = req.body;

	try {
		let user = await User.findOne({ email });

		if (user) {
			return res.status(400).json({ message: "User already exists" });
		}

		const isFirstUser = (await User.countDocuments()) === 0;
		const role = isFirstUser ? "admin" : "user";

		user = new User({
			firstname,
			email,
			password,
			role,
		});

		await user.save();

		res.status(201).json({
			_id: user._id,
			firstname: user.firstname,
			email: user.email,
			role: user.role,
			token: generateToken(user._id),
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Authenticate user & get token
exports.authUser = [
	loginLimiter,
	async (req, res) => {
		const { email, password } = req.body;

		try {
			const user = await User.findOne({ email });

			if (user && (await user.matchPassword(password))) {
				res.json({
					_id: user._id,
					firstname: user.firstname,
					email: user.email,
					role: user.role,
					token: generateToken(user._id),
				});
			} else {
				return res.status(401).json({ message: "Invalid email or password" });
			}
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: "Server error", error: error.message });
		}
	},
];

// Get user by token
exports.getUserByToken = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		res.json(user);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

