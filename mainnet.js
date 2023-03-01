import { ethers } from "ethers";
import BUSD_ABI from "./busd.abi.json" assert { type: "json" };
import ROUTER_ABI from "./router.abi.json" assert { type: "json" };
import WBNB_ABI from "./wbnb.abi.json" assert { type: "json" };
import FACTORY_ABI from "./factory.abi.json" assert { type: "json" };
import PAIR_ABI from "./pair.abi.json" assert { type: "json" };

const provider = new ethers.providers.JsonRpcProvider(
  "https://bsc-dataseed.binance.org/"
);

const signer = new ethers.Wallet(
  "87a205e8945f0681e71eb2e13ebeed0d15ee61a2ac70406f4876cb738649c60a",
  provider
);

const BUSD = new ethers.Contract(
  "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
  BUSD_ABI,
  provider
);

const Router = new ethers.Contract(
  "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  ROUTER_ABI,
  provider
);

const Factory = new ethers.Contract(
  "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  FACTORY_ABI,
  provider
);

const WBNB = new ethers.Contract(
  "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  WBNB_ABI
);

// TODO: get synchronous primary address
// TODO: Switch account

const main = async () => {
  // const pairAddress = await Factory.getPair(WBNB.address, BUSD.address);
  // console.log(pairAddress);

  // const Pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
  // const [reserve0, reserve1] = await Pair.getReserves();

  // const amountOut = ethers.BigNumber.from(
  //   await Router.getAmountOut(ethers.utils.parseEther("1"), reserve0, reserve1)
  // ).toString();
  // console.log(ethers.utils.formatEther(amountOut));

  // const gasPrice = await provider.getGasPrice();

  // console.log(
  //   ethers.utils.formatUnits(
  //     await Router.estimateGas.swapETHForExactTokens(
  //       amountOut,
  //       [WBNB.address, BUSD.address],
  //       signer.address,
  //       Math.floor(Date.now() / 1000) + 60 * 20,
  //       { value: ethers.utils.parseEther("1.1"), gasPrice }
  //     ),
  //     "gwei"
  //   )
  // );
};

main();
