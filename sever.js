import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Ensure uploads folder exists
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// Multer config
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Handle image upload
app.post("/upload", upload.single("image"), (req, res) => {
    res.redirect("/");
});

// Return array of image filenames
app.get("/images", (req, res) => {
    fs.readdir("./uploads", (err, files) => {
        if (err) return res.json([]);
        res.json(files);
    });
});

app.listen(PORT, () => console.log("Running at http://localhost:" + PORT));
