import { Wallet } from "../models/walletModel";
import { UserRequestHandler } from "../types/authenticatedRequest";

export const getUserWallet: UserRequestHandler = async (req, res, next) => {
  const userId = req.userId as string;
  try {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      // try creating new wallet
      wallet = await Wallet.create({ user: userId, balance: 0 });
    }
    if (!wallet) {
      res.status(400).json({
        success: false,
        message: "Couldn't find wallet",
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: { balance: wallet.balance, history: wallet.history },
    });
  } catch (error) {
    next(error);
  }
};
