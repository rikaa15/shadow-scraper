import {getData} from "./shadow";


const main = async () => {
  try {
    const shadowData = await getData({
      owner: '0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A',
      transactionId: "0x8a84f5724c8a3bbd5996ee95b81d19d1350ddc6f3362e126a12df5bf41d6302c"
    })
    // console.log('shadowData', shadowData)
  } catch (e) {
    console.error('failed to get portfolio data', e)
  }
}

main()
