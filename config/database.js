const mongoose = require("mongoose");
require("dotenv").config();

const { MONGODB_URI } = process.env;

async function connectDB() {
	try {
		await mongoose.connect(MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log("Connected to MongoDB");
	} catch (error) {
		console.error("Error connecting to MongoDB:", error);
		process.exit(1);
	}
}

module.exports = connectDB;
