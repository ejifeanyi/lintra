const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
require("dotenv").config();

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
		console.error(error); // Log the actual error
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Authenticate user & get token
exports.authUser = async (req, res) => {
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
			res.status(401).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		console.error(error); // Log the actual error
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

exports.getUserByToken = async (req, res) => {
	try {
		// `req.user` should contain the authenticated user data if `protect` middleware is correctly implemented
		const user = await User.findById(req.user._id).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		res.json(user);
	} catch (error) {
		console.error(error); // Log the actual error
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Add user to project
exports.addUserToProject = async (req, res) => {
	const { email } = req.body;
	const { projectId } = req.params;

	try {
		const project = await Project.findById(projectId);
		if (!project) return res.status(404).json({ message: "Project not found" });

		if (project.admin.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Not authorized" });
		}

		const user = await User.findOne({ email });
		if (!user) return res.status(404).json({ message: "User not found" });

		if (!project.users.includes(user._id)) {
			project.users.push(user._id);
			await project.save();
		}

		res.status(200).json(project);
	} catch (error) {
		console.error(error); // Log the actual error
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Remove user from project
exports.removeUserFromProject = async (req, res) => {
	const { userId } = req.body;
	const { projectId } = req.params;

	try {
		const project = await Project.findById(projectId);
		if (!project) return res.status(404).json({ message: "Project not found" });

		if (project.admin.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Not authorized" });
		}

		project.users = project.users.filter((user) => user.toString() !== userId);
		await project.save();

		res.status(200).json({ message: "User removed from project", project });
	} catch (error) {
		console.error(error); // Log the actual error
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
