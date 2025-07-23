// authUser.js
const jwt = require("jsonwebtoken");
// const secretKey = process.env.JWT_SECRET || "secretKey_default"; // samakan dengan yang kamu pakai di login
const secretKey = "hkalshd9832yhui234hg234gjksdfsdnbnsvoisdsii";

const authUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Token tidak ditemukan" });
  }

  const token = authHeader.split(" ")[1];
  console.log(token);
  
  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // simpan data user ke req.user supaya bisa dipakai di route selanjutnya
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token tidak valid", error });
  }
};

module.exports = authUser;
