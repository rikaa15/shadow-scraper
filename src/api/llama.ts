import axios from "axios";

export const getBlockAtTimestamp = async (timestamp: string | number) => {
  const { data } = await axios.get<{
    height: number; timestamp: number
  }>(`https://coins.llama.fi/block/sonic/${timestamp}`)
  return data.height
}
