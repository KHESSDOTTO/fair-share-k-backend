// order model precisa ter ao menos uma propriedade de business, uma de client, uma de product, uma de preço, uma
// de status e um _id. Importar OrderModel quando existir.

import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { isClient } from "../middlewares/isClient.js";
import attachCurrentUser from "../middlewares/attachCurrentUser.js";
import { UserModel } from "../model/user.model.js";
import { OrderModel } from "../model/order.model.js";

const orderRouter = express.Router();

// Usuário logado (client) cria um novo pedido.
orderRouter.post(
  "/create",
  isAuth,
  attachCurrentUser,
  isClient,
  async (req, res) => {
    try {
      const newOrder = await OrderModel.create({
        ...req.body,
        client: req.currentUser._id,
      });
      await UserModel.findByIdAndUpdate(req.currentUser._id, {
        $push: { orders: newOrder._doc._id },
      });
      await UserModel.findByIdAndUpdate(newOrder._doc.business, {
        $push: { orders: newOrder._doc._id },
      });
      return res.status(201).json(newOrder);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Usuario pode apagar (soft delete) pedidos do seu historico de pedidos.
orderRouter.delete(
  "/delete/:orderId",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const { orderId } = req.params,
        updatedUser = await UserModel.findByIdAndUpdate(
          req.currentUser._id,
          { $pull: { orders: orderId } },
          { runValidators: true, new: true }
        );
      console.log(`Soft deleted: ${orderId}. From: ${updatedUser._doc.name}.`);
      return res.status(200).json(updatedUser);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Usuario pode editar o status do pedido (empresa pode aceitar, rejeitar e concluir / cliente pode cancelar).
orderRouter.put(
  "/edit/status/:orderId",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const { status } = req.body,
        { orderId } = req.params,
        selOrder = await OrderModel.findById(orderId);

      // Verifica se o pedido pertence ao usuario logado (client ou business)
      if (
        JSON.stringify(req.currentUser._id) !=
          JSON.stringify(selOrder._doc.client) &&
        JSON.stringify(req.currentUser._id) !=
          JSON.stringify(selOrder._doc.business)
      ) {
        return res.status(401).json("You can't edit this order.");
      }

      // Rejeita se nao houver um campo 'status' no corpo da requisicao
      if (!req.body.status) {
        return res
          .status(401)
          .json("Please, send a 'status' key to change the status.");
      }

      // Checa se o pedido ja foi concluido, rejeitado, ou aceito/confirmado.
      if (
        selOrder._doc.status === "CONCLUDED" ||
        selOrder._doc.status === "CANCELED" ||
        selOrder._doc.status === "REJECTED BY COMPANY"
      ) {
        return res.status(401).json(`Order already ${selOrder._doc.status}.`);
      }

      // Checa o type de usuario logado para identificar os status que seria validos em uma solicitacao de alteracao.
      let validNewStatus = [];
      if (req.currentUser.type === "BUSINESS") {
        validNewStatus = [
          "REJECTED BY COMPANY",
          "CONFIRMED BY COMPANY",
          "CONCLUDED",
        ];
      } else if (req.currentUser.type === "CLIENT") {
        validNewStatus = ["CANCELED"];
      }

      // Checa se o novo status e valido de acordo com o tipo de usuario logado.
      if (!validNewStatus.includes(req.body.status)) {
        return res.status(401).json("Please, insert a valid status.");
      }

      const updatedOrder = await OrderModel.findByIdAndUpdate(
        orderId,
        { status: req.body.status },
        { runValidators: true, new: true }
      );
      return res.status(200).json(updatedOrder);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Cliente ou empresa (usuario logado) podem visualizar os seus pedidos - EU PRECISO CONSERTAR.
orderRouter.get(
  "/get/myOrders",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const myOrders = await UserModel.findById(req.currentUser._id, {
        orders: 1,
        passwordHash: 0,
      }).populate("orders");
      return res.status(200).json(myOrders);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

// Usuario logado pode visualizar algum pedido especifico, contanto que seja seu.
orderRouter.get(
  "/get/:orderId",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const { orderId } = req.params,
        selOrder = await OrderModel.findById(orderId);
      if (
        JSON.stringify(selOrder._doc.business) !=
          JSON.stringify(req.currentUser._id) &&
        JSON.stringify(selOrder._doc.client) !=
          JSON.stringify(req.currentUser._id)
      ) {
        console.log(selOrder._doc.business);
        console.log(selOrder._doc.client);
        console.log(req.currentUser._id);
        return res.status(401).json("Unauthorized.");
      }
      return res.status(200).json(selOrder);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

export { orderRouter };
