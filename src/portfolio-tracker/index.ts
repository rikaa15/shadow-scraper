import {getInfo} from "./swapx";

const userAddress = '0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A'

const main = async () => {
  try {
    // const shadowData = await getData({
    //   owner: '0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A',
    //   transactionId: "0x8a84f5724c8a3bbd5996ee95b81d19d1350ddc6f3362e126a12df5bf41d6302c"
    // })

    const swapXInfo = await getInfo(userAddress)
    console.log(`SwapX portfolio: rewards earned: ${
      swapXInfo.rewardsAmountFormatted
    }, rewards token: ${
      swapXInfo.rewardTokenSymbol
    } (${
      swapXInfo.rewardTokenAddress
    })`)
  } catch (e) {
    console.error('failed to get portfolio data', e)
  }
}

main()
