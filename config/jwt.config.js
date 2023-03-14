import jwt from "jsonwebtoken";

// obs para refatoração posterior: testar passando apenas o _id. Pois o "attachCurrentUser" utiliza somente ele para a query
// que obtém e salva as demais informações do ususário logado.

export function generateToken(user) {
  const signature = process.env.TOKEN_SIGN_SECRET;
  const expiration = "12h";
  if (user.type === "BUSINESS") {
    const {
      _id,
      name,
      email,
      picture,
      type,
      businessType,
      address,
      neighborhood,
      cnpj,
      contactPhone,
      emailConfirm,
      isActive,
      createdAt,
    } = user;
    return jwt.sign(
      {
        _id,
        name,
        email,
        picture,
        type,
        businessType,
        address,
        neighborhood,
        cnpj,
        contactPhone,
        emailConfirm,
        isActive,
        createdAt,
      },
      signature,
      {
        expiresIn: expiration,
      }
    );
  } else if (user.type === "CLIENT") {
    const {
      _id,
      name,
      email,
      picture,
      type,
      address,
      neighborhood,
      cpf,
      contactPhone,
      emailConfirm,
      isActive,
      createdAt,
    } = user;
    return jwt.sign(
      {
        _id,
        name,
        email,
        picture,
        type,
        address,
        neighborhood,
        cpf,
        contactPhone,
        emailConfirm,
        isActive,
        createdAt,
      },
      signature,
      {
        expiresIn: expiration,
      }
    );
  }
}
