import { ethers } from "ethers";
import BEP20_ABI from "./bep20.abi.json" assert { type: "json" };
import ROUTER_ABI from "./router.abi.json" assert { type: "json" };
import WBNB_ABI from "./wbnb.abi.json" assert { type: "json" };
import FACTORY_ABI from "./factory.abi.json" assert { type: "json" };
import PAIR_ABI from "./pair.abi.json" assert { type: "json" };

const provider = new ethers.providers.JsonRpcProvider(
  "https://data-seed-prebsc-1-s1.binance.org:8545/"
);

const signer = new ethers.Wallet(
  "d56bf3b751cf0dc8cb9aa46c5d1c7ca25686f4cb1e6bb6a2c45d50b4b0d5ff0e",
  provider
);

const BUSD = new ethers.Contract(
  "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7",
  BEP20_ABI,
  signer
);

const USDT = new ethers.Contract(
  "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684",
  BEP20_ABI,
  signer
);

const Router = new ethers.Contract(
  "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
  ROUTER_ABI,
  signer
);

const Factory = new ethers.Contract(
  "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
  FACTORY_ABI,
  provider
);

const WBNB = new ethers.Contract(
  "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
  WBNB_ABI,
  provider
);

// TODO: get synchronous primary address
// TODO: Switch account

const predictAmountOutSwapBNBForTokens = async (
  amountInWei,
  tokenBuy,
  provider
) => {
  const pairAddress = await Factory.getPair(WBNB.address, tokenBuy.address);
  const Pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);

  let [reserve0, reserve1] = await Pair.getReserves();
  [reserve0, reserve1] = ethers.BigNumber.from(WBNB.address).gt(
    ethers.BigNumber.from(tokenBuy.address)
  ) /*
      by default getReserves will sort the tokens based on address
      so we need to sort the reserves in order to get reserve correctly
    */
    ? [reserve1, reserve0]
    : [reserve0, reserve1];

  // Predict the amount out we can get
  const amountOutWei = await Router.getAmountOut(
    amountInWei,
    reserve0,
    reserve1
  );

  return amountOutWei;
};

const getGasFeeSwapBNBForTokens = async (
  amountOutWei,
  tokenBuy,
  amountInWei,
  signer
) => {
  const gasPrice = await provider.getGasPrice();
  const gasLimit = await signer.estimateGas(
    await Router.populateTransaction.swapETHForExactTokens(
      amountOutWei,
      [WBNB.address, tokenBuy.address],
      signer.address,
      Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
      { gasPrice, value: amountInWei }
    )
  );
  return { gasPrice, gasLimit };
};

const swapBNBForTokens = async (amountIn, tokenBuy, signer, provider) => {
  const amountInWei = ethers.utils.parseEther(amountIn);

  // Predict the amount out we can get
  const amountOutWei = await predictAmountOutSwapBNBForTokens(
    amountInWei,
    tokenBuy,
    provider
  );

  const { gasPrice, gasLimit } = await getGasFeeSwapBNBForTokens(
    amountOutWei,
    tokenBuy,
    amountInWei,
    signer
  );

  const rawTxn = await Router.populateTransaction.swapETHForExactTokens(
    amountOutWei,
    [WBNB.address, tokenBuy.address],
    signer.address,
    Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
    { gasPrice, gasLimit, value: amountInWei }
  );

  const sendTxn = await signer.sendTransaction(rawTxn);
  const receipt = await sendTxn.wait();

  return { sendTxn, receipt };
};

const parseToken = async (token, value) => {
  // convert the amountIn (format in BNB) to Wei
  const tokenDecimals = await token.decimals();
  const amountInWei = ethers.utils.parseUnits(value, tokenDecimals);
  return amountInWei;
};

const predictAmountOutSwapTokensForBNB = async (
  amountInWei,
  tokenSell,
  provider
) => {
  const pairAddress = await Factory.getPair(tokenSell.address, WBNB.address);
  const Pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);

  let [reserve0, reserve1] = await Pair.getReserves();
  [reserve0, reserve1] = ethers.BigNumber.from(tokenSell.address).gt(
    ethers.BigNumber.from(WBNB.address)
  ) /*
      by default getReserves will sort the tokens based on address
      so we need to sort the reserves in order to get reserve correctly
    */
    ? [reserve1, reserve0]
    : [reserve0, reserve1];

  // Predict the amount out we can get
  const amountOutWei = await Router.getAmountOut(
    amountInWei,
    reserve0,
    reserve1
  );

  return amountOutWei;
};

const approve = async (tokenContract, spenderAddress, amountInWei) => {
  const txApprove = await tokenContract.approve(spenderAddress, amountInWei);
  await txApprove.wait();
};

const getGasFeeSwapTokensForBNB = async (
  amountWei,
  amountOut,
  tokenSell,
  signer,
  provider
) => {
  const gasPrice = await provider.getGasPrice();
  console.log(ethers.utils.formatUnits(gasPrice, "gwei"));
  const gasLimit =
    await Router.estimateGas.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountWei,
      amountOut,
      [tokenSell.address, WBNB.address],
      signer.address,
      Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
      { gasPrice }
    );
  console.log(gasLimit.toString());

  return { gasPrice, gasLimit };
};

const estimateGasFeeSwapTokensForBNB = async (
  amountIn,
  tokenSell,
  signer,
  provider
) => {
  const amountInWei = parseToken(tokenSell, amountIn);

  // Predict the amount out we can get
  const amountOutWei = await predictAmountOutSwapTokensForBNB(
    amountInWei,
    tokenSell,
    provider
  );

  return getGasFeeSwapTokensForBNB(
    amountInWei,
    amountOutWei,
    tokenSell,
    signer,
    provider
  );
};

const swapTokensForBNB = async (amountIn, tokenSell, signer, provider) => {
  const amountInWei = parseToken(tokenSell, amountIn);

  // Predict the amount out we can get
  const amountOutWei = await predictAmountOutSwapTokensForBNB(
    amountInWei,
    tokenSell,
    provider
  );

  // Approve the router to swap from BUSD to BNB
  // this is a write contract and costs gas fee
  await approve(tokenSell, Router.address, amountInWei);

  const { gasLimit, gasPrice } = await getGasFeeSwapTokensForBNB(
    amountInWei,
    amountOutWei,
    tokenSell,
    signer,
    provider
  );

  const rawTxn =
    await Router.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountInWei,
      amountOutWei,
      [tokenSell.address, WBNB.address],
      signer.address,
      Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
      { gasPrice, gasLimit }
    );

  const sendTxn = await signer.sendTransaction(rawTxn);
  const receipt = await sendTxn.wait();

  return { sendTxn, receipt };
};

const main = async () => {
  // const { sendTxn, receipt } = await swapBNBForTokens(
  //   "0.001",
  //   USDT,
  //   signer,
  //   provider
  // );

  // Get gas limit for tokens:
  // hard code for the first time
  // from the second time get the cache for the gas limit
  // const { sendTxn, receipt } =
  await swapTokensForBNB("10", USDT, signer, provider);
  // if (receipt) {
  //   console.log(
  //     " - Transaction is mined - " + "\n" + "Transaction Hash:",
  //     sendTxn.hash +
  //       "\n" +
  //       "Block Number: " +
  //       receipt.blockNumber +
  //       "\n" +
  //       "Navigate to https://rinkeby.etherscan.io/txn/" +
  //       sendTxn.hash,
  //     "to see your transaction"
  //   );
  // } else {
  //   console.log("Error submitting transaction");
  // }
};

main();
