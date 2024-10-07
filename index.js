require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/database");

const { PORT } = process.env;

// Create the server from the app instance
const server = http.createServer(app);

connectDB().then(() => {
	server.listen(PORT, () => {
		console.info(`Server is listening on PORT ${PORT}`);
	});
});
