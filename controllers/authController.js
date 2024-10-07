const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.verifyToken = (req, res) => {
	const token = req.body.token;
	if (!token) {
		return res.status(400).json({ message: "Token is required" });
	}

	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) {
			// Check for specific error types
			if (err.name === "TokenExpiredError") {
				return res.status(401).json({ message: "Token expired" });
			} else if (err.name === "JsonWebTokenError") {
				return res.status(401).json({ message: "Invalid token" });
			} else {
				return res.status(401).json({ message: "Token verification failed" });
			}
		}

		res.json({ success: true, decoded });
	});
};
