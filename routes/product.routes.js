// product model precisa ter ao menos uma propriedade de criador, um nome, um preco, uma descricao, e um _id.
// importar ProductModel quando existir.

import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { isBusiness } from "../middlewares/isBusiness.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import { UserModel } from "../model/user.model.js";
import { ProductModel } from "../model/product.model.js";

const productRouter = express.Router();

// Criar novo prouduct (empresa logada).
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
      return res.status(201).json(newProduct);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Empresa logada pode apagar um produto seu - SERA UMA ROTA DESCONTINUADA!! SUBSTITUIR POR ROTA QUE MUDA A PROPRIEDADE isActive
// para FALSE e, assim, exclui ele da busca (adaptar filtro do frontend) e exclui da visualização de produtos ativos no front.
// Adicionar botão no front para acessar produtos inativos. Para apagar o produto da lista de inativos, há apenas a exclusão do ID
// do produto da sua lista 'products' - softDelete. Assim, o histórico de pedidos não seria comprometido.
productRouter.delete(
  "/delete/:productId",
  isAuth,
  attachCurrentUser,
  isBusiness,
  async (req, res) => {
    try {
      const { productId } = req.params,
        selProduct = await ProductModel.findById(productId);
      if (
        JSON.stringify(selProduct._doc.creator) !=
        JSON.stringify(req.currentUser._id)
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
      return res.status(200).json(deletedProduct);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Get all products (feed) - rota não protegida.
productRouter.get("/get/all", async (req, res) => {
  try {
    const allProducts = await ProductModel.find({}).populate({
      path: "creator",
      select: "-passwordHash -orders",
    });
    return res.status(200).json(allProducts);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// Empresa logada pode visualizar todos os seus produtos.
productRouter.get(
  "/get/myProducts",
  isAuth,
  attachCurrentUser,
  isBusiness,
  async (req, res) => {
    try {
      const myProducts = await ProductModel.find({
        creator: req.currentUser._id,
      }).populate({
        path: "creator",
        select: "-passwordHash -orders",
      });
      return res.status(200).json(myProducts);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Usuário logado (client ou business) pode acessar algum produto específico pelo ID (details).
productRouter.get("/get/:productId", isAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const selProduct = await ProductModel.findById(productId).populate({
      path: "creator",
      select: "-passwordHash -orders",
    });
    if (!selProduct) {
      return res.status(404).json("Product not found.");
    }
    return res.status(200).json(selProduct);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// Empresa logada pode alterar o seu product.
productRouter.put(
  "/edit/:productId",
  isAuth,
  attachCurrentUser,
  isBusiness,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const selProduct = await ProductModel.findById(productId);
      if (
        JSON.stringify(req.currentUser._id) !=
        JSON.stringify(selProduct._doc.creator)
      ) {
        return res
          .status(401)
          .json(
            "Unauthorized - product being edited does not belong to the business that is trying to edit it."
          );
      }
      if (req.body.name || req.body.price) {
        return res
          .status(401)
          .json(
            "To change the name or the price of the offer, please delete this offer and make another one."
          );
      }
      const updatedProduct = await ProductModel.findByIdAndUpdate(
        productId,
        { ...req.body },
        { runValidators: true, new: true }
      );
      return res.status(200).json(updatedProduct);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

export { productRouter };
