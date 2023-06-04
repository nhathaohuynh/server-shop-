// create token and saving that in cookies

export const sendToken = (model, statusCode, res) => {
  const token = model.getJwtToken();

  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 1000),
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    model,
    token,
  });
};

export const sendShopToken = (seller, statusCode, res) => {
  const token = seller.getJwtToken();

  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 1000),
  };

  res.status(statusCode).cookie("shop_token", token, options).json({
    success: true,
    seller,
    token,
  });
};
