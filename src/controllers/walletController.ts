import { HttpStatus } from "../utils/httpenum";
import { Wallet } from "../models/walletModel";
import { UserRequestHandler } from "../types/authenticatedRequest";

export const getUserWallet: UserRequestHandler<
  {},
  any,
  any,
  { page?: string; limit?: string }
> = async (req, res, next) => {
  const userId = req.userId as string;

  const { page = "1", limit = "10" } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    res
      .status(400)
      .json({ success: false, message: "Invalid pagination parameters" });
    return;
  }

  try {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      // try creating new wallet
      wallet = await Wallet.create({ user: userId, balance: 0 });
    }
    if (!wallet) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Couldn't find wallet",
      });
      return;
    }

    const totalHistoryItems = wallet.history.length;
    const totalPages = Math.ceil(totalHistoryItems / limitNum) || 1;
    const history = wallet.history
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .splice((pageNum - 1) * limitNum, limitNum);

    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        balance: wallet.balance,
        history,
      },
      currentPage: pageNum,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};
