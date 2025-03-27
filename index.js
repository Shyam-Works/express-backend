import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import { app } from "./src/app.js";

// Load environment variables
dotenv.config({
    path: './.env'
});

// Connect to the database and start the server
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 8000;

        app.listen(PORT, () => {
            console.log(`🚀 Server is running at port: ${PORT}`);
        });
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        process.exit(1);
    }
};

// Start the server
startServer();
