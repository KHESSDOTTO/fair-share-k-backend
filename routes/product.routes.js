// product model precisa ter ao menos uma propriedade de criador, um nome, um preco, uma descricao, e um _id.
// importar ProductModel quando existir.

import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { isBusiness } from "../middlewares/isBusiness.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import { UserModel } from "../model/user.model.js";

const productRouter = express.Router();

// Criar novo post (empresa logada).
productRouter.post(
  "/create",
  isAuth,
  attachCurrentUser,
  isBusiness,
  async (req, res) => {
    try {
      const newProduct = await ProductModel.create({
          ...req.body,
          creator: req.currentUser._id,
        }),
        updatedUser = await UserModel.findByIdAndUpdate(req.currentUser._id, {
          $push: { products: newProduct._doc._id },
        });
      delete updatedUser._doc.passwordHash;
      return res.status(201).json(newProduct, updatedUser);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Empresa logada pode apagar um produto seu.
productRouter.delete(
  "/delete",
  isAuth,
  attachCurrentUser,
  isBusiness,
  async (req, res) => {
    try {
      const { productId } = req.body;
      if (
        (await ProductModel.findById(productId)._doc.creator) !==
        req.currentUser._id
      ) {
        return res
          .status(401)
          .json("Not authorized. Another company's product.");
      }
      const deletedProduct = await ProductModel.findByIdAndDelete(productId);
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.currentUser._id,
        {
          $pull: { products: deletedProduct._doc._id },
        }
      );
      delete updatedUser._doc.passwordHash;
      return res.status(201).json(deletedProduct, updatedUser);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Get all products (feed) - rota não protegida.
// productRouter.get()

// Empresa logada pode visualizar todos os seus produtos.

// Usuário logado (client ou business) pode acessar algum produto específico pelo ID (details).

// Empresa logada pode alterar o seu product.

export { productRouter };
