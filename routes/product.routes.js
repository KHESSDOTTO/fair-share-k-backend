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

// Empresa logada pode apagar um produto seu - alterado para softDelete.
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
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.currentUser._id,
        {
          isActive: false,
          $pull: { products: deletedProduct._doc._id },
        }
      );
      return res.status(200).json(updatedUser);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Inativar produto
productRouter.put(
  "/inactivate/:productId",
  isAuth,
  attachCurrentUser,
  isBusiness,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const selProduct = await ProductModel.findById(productId);
      if (
        JSON.stringify(req.currentUser._id) !==
        JSON.stringify(selProduct._doc.creator)
      ) {
        return res.status(401).json("User unauthorized.");
      }
      const inactivatedProduct = await ProductModel.findByIdAndUpdate(
        productId,
        {
          isActive: false,
        },
        {
          runValidators: true,
          new: true,
        }
      );
      return res.status(200).json(inactivatedProduct);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Reativar produto
productRouter.put(
  "/reactivate/:productId",
  isAuth,
  attachCurrentUser,
  isBusiness,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const selProduct = await ProductModel.findById(productId);
      if (
        JSON.stringify(req.currentUser._id) !==
        JSON.stringify(selProduct._doc.creator)
      ) {
        return res.status(401).json("User unauthorized.");
      }
      if (!JSON.stringify(req.currentUser.products).includes(productId)) {
        return res.status(401).json("Product excluded.");
      }
      const reactivatedProduct = await ProductModel.findByIdAndUpdate(
        productId,
        {
          isActive: true,
        },
        {
          runValidators: true,
          new: true,
        }
      );
      return res.status(200).json(reactivatedProduct);
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
