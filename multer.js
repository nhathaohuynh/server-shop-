import multer from "multer";

import path from "path";

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = file.originalname.split(".")[0];
    cb(null, fileName + "-" + uniqueSuffix + ".png");
  },
});

export default multer({ storage: storage });
