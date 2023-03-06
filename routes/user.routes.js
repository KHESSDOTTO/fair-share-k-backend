import express from "express";
import { generateToken } from "../config/jwt.config.js";
import isAuth from "../middlewares/isAuth.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import { UserModel } from "../model/user.model.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { isClient } from "../middlewares/isClient.js";

const SALT_ROUNDS = 10;
const userRouter = express.Router();

let transporter = nodemailer.createTransport({
  service: "Hotmail",
  auth: {
    secure: false,
    user: "fairshare-wd@hotmail.com",
    pass: "SenhaSegura321",
  },
});

// Criar um novo usuario.
userRouter.post("/signup", async (req, res) => {
  try {
    const { password, email } = req.body;
    if (
      !password ||
      !password.match(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/gm
      )
    ) {
      return res.status(400).json({
        msg: "Invalid email or password. Check if both match the required format.",
      });
    }
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    const createdUser = await UserModel.create({
      ...req.body,
      passwordHash: hashedPassword,
    });
    delete createdUser._doc.passwordHash;
    delete createdUser._doc.favorites;
    const mailOptions = {
      from: "fairshare-wd@hotmail.com",
      to: email,
      subject: "Ativação de conta",
      html: `<p>Clique aqui para ativar sua conta:<p> <a href=http://localhost:${process.env.PORT}/api/user/activate-account/${createdUser._id}>CLIQUE AQUI</a>`,
    };
    // await transporter.sendMail(mailOptions);
    return res.status(201).json(createdUser);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

userRouter.get("/activate-account/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findOne({ _id: userId });
    if (!user) {
      return res.send("Try again");
    }
    await UserModel.findByIdAndUpdate(userId, { emailConfirm: true });
    res.send("Account confirmed!");
  } catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
});

// Fazer login.
userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ msg: "Invalid email or password." });
    }
    if (await bcrypt.compare(password, user.passwordHash)) {
      const token = generateToken(user);
      delete user._doc.passwordHash;
      delete user._doc.favorites;
      if (!user.emailConfirm) {
        return res.status(404).json({ msg: "Account not yet confirmed" });
      }
      return res.status(200).json({
        user: { ...user._doc },
        token: token,
      });
    } else {
      return res.status(401).json({ msg: "Invalid email or password." });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// Acessar somente infos do usuario logado.
userRouter.get("/get", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const cUser = await UserModel.findById(req.currentUser._id);
    delete cUser._doc.passwordHash;
    return res.status(200).json(cUser);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// Editar somente infos do usuario logado.
userRouter.put("/edit", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.currentUser._id,
      { ...req.body },
      { runValidators: true, new: true }
    );
    delete updatedUser._doc.passwordHash;
    return res.status(200).json(updatedUser);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// Apagar somente o proprio usuario logado.
userRouter.delete("/delete", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const deletedUser = await UserModel.findByIdAndDelete(req.currentUser._id);
    delete deletedUser._doc.passwordHash;
    return res.status(200).json("User deleted.");
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// Cliente logado pode favoritar (dar like) nos produtos

userRouter.post(
  "/post/favorites/:businessId",
  isAuth,
  attachCurrentUser,
  isClient,
  async (req, res) => {
    try {
      const { businessId } = req.params;

      await UserModel.findByIdAndUpdate(businessId, {
        $addToSet: { favorites: businessId },
      });
      return res.status(200).json(newFavorite);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Cliente logado pode acessar todos os seus favoritos

userRouter.get(
  "/get/all-favorites",
  isAuth,
  attachCurrentUser,
  isClient,
  async (req, res) => {
    try {
      const userFavorite = await UserModel.findById(
        req.currentUser._id
      ).populate("favorites");
      return res.status(201).json(userFavorite);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

export { userRouter };
