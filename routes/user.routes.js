import express from "express";
import { generateToken } from "../config/jwt.config.js";
import isAuth from "../middlewares/isAuth.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import { UserModel } from "../model/user.model.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
const userRouter = express.Router();

userRouter.post("/signup", async (req, res) => {
  try {
    const { password } = req.body;
    if (
      !password ||
      !password.match(
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/gm
      )
    ) {
      return res.status(400).json({
        msg: "Email ou senha invalidos. Verifique se ambos atendem as requisições.",
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
    return res.status(201).json(createdUser);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ msg: "Email ou senha invalidos." });
    }
    if (await bcrypt.compare(password, user.passwordHash)) {
      const token = generateToken(user);
      delete user._doc.passwordHash;
      delete user._doc.favorites;
      return res.status(200).json({
        user: { ...user._doc },
        token: token,
      });
    } else {
      return res.status(401).json({ msg: "Email ou senha invalidos." });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

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

userRouter.delete("/delete", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const deletedUser = await UserModel.findByIdAndDelete(req.currentUser._id);
    delete deletedUser._doc.passwordHash;
    return res.status(200).json(deletedUser);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

export { userRouter };
