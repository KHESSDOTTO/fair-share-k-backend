import express from "express";
import { generateToken } from "../config/jwt.config.js";
import isAuth from "../middlewares/isAuth.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import { UserModel } from "../model/user.model.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { isClient } from "../middlewares/isClient.js";
import { ProductModel } from "../model/product.model.js";

const SALT_ROUNDS = 10;
const userRouter = express.Router();

let transporter = nodemailer.createTransport({
  service: "Hotmail",
  auth: {
    secure: false,
    user: "fairshare-wd-k@hotmail.com",
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
      subject: "Activate account",
      html: `<p>Click here to activate your account:<p> <a href=https://fair-share.cyclic.app/api/user/activate-account/${createdUser._id}>CLICK HERE</a>`,
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

// Apagar (inativar, softDelete) somente o proprio usuario logado.
userRouter.delete("/delete", isAuth, attachCurrentUser, async (req, res) => {
  try {
    let softDeletedUser = await UserModel.findById(req.currentUser._id);
    if (softDeletedUser._doc.type === "BUSINESS") {
      await ProductModel.updateMany(
        { creator: req.currentUser._id },
        { isActive: false },
        { runValidators: true, new: true }
      );
    }
    softDeletedUser = await UserModel.findByIdAndUpdate(
      req.currentUser._id,
      { isActive: false },
      { runValidators: true, new: true }
    );
    delete softDeletedUser._doc.passwordHash;
    return res.status(200).json("User inactivated.");
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// Reativar usuário
userRouter.put(
  "/reactivate/:userId",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const reactivatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { isActive: true },
        { runValidators: true, new: true }
      );
      return res.status(200).json(reactivatedUser);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Cliente logado pode favoritar (dar like) nos produtos

userRouter.post(
  "/post/favorites/:businessId",
  isAuth,
  attachCurrentUser,
  isClient,
  async (req, res) => {
    try {
      const { businessId } = req.params;
      const newFavorite = await UserModel.findById(businessId);
      if (newFavorite._doc.type === "CLIENT") {
        return res.status(401).json("You can only favorite Businesses.");
      }
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.currentUser._id,
        {
          $addToSet: { favorites: businessId },
        },
        { runValidators: true, new: true }
      );
      delete updatedUser.passwordHash;
      return res.status(200).json(updatedUser);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Cliente logado pode desfavoritar um produto

userRouter.put(
  "/edit/favorites/:businessId",
  isAuth,
  attachCurrentUser,
  isClient,
  async (req, res) => {
    try {
      const { businessId } = req.params;
      await UserModel.findByIdAndUpdate(req.currentUser._id, {
        $pull: { favorites: businessId },
      });
      return res.status(200).json(req.currentUser.favorites);
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
      const userFavorite = await UserModel.findById(req.currentUser._id, {
        favorites: 1,
      }).populate({ path: "favorites" });
      return res.status(201).json(userFavorite);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

export { userRouter };
