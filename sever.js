import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// ensure uploads folder exists
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// configure multer for image uploads
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.post("/upload", upload.single("image"), (req, res) => {
    res.redirect("/");
});

app.get("/images", (req, res) => {
    fs.readdir("./uploads", (err, files) => {
        if (err) return res.json([]);
        res.json(files);
    });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
