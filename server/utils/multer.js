import multer from "multer";
import path from "path";
import fs from "fs";

// Use an ABSOLUTE path so ffmpeg (and other tools) can always find the file
// regardless of the cwd when they run.
const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir });
export default upload;
