import {Box, Text} from "grommet";
import {Button, Input} from "antd";
import {useState} from "react";
import {getShadowInfo} from "../../../../shadow";
import {getSwapXInfo} from "../../../../swapx";
import {getMagpieInfo} from "../../../../magpie";
import {getSiloInfo} from "../../../../silo";
import {getEulerInfo} from "../../../../euler";
import {getSpectraInfo} from "../../../../spectra";
import {PortfolioItem} from "../../../../types.ts";

export const PortfolioPage = () => {
  const [inProgress, setInProgress] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState('0x881E625E5C30973b47ceE3a0f3Ef456012F13f7D')

  const onGetRewardsClick = async () => {
    setInProgress(true)
    const portfolioItems: PortfolioItem[] = []

    const dataProviders = [
      getShadowInfo,
      getSwapXInfo,
      getMagpieInfo,
      getSiloInfo,
      getEulerInfo,
      getSpectraInfo
    ]

    for(let i = 0; i < dataProviders.length; i++) {
      const fetchData = dataProviders[i]
      try {
        setStatus(`Fetching data ${i + 1}/${dataProviders.length}`)
        const data = await fetchData(walletAddress)
        portfolioItems.push(...data)
      } catch (e) {
        console.error('Failed to fetch data', i, e)
      }
    }

    setInProgress(false)
  }

  return <Box pad={'32px'}>
    <Box>
      <Text size={'22px'} weight={600}>Portfolio Tracker</Text>
    </Box>
    <Box margin={{ top: '32px' }}>
      <Box gap={'8px'} width={'400px'}>
        <Text>Wallet Address</Text>
        <Input
          placeholder={'0x...'}
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
      </Box>
      <Box margin={{ top: '32px' }} width={'200px'}>
        <Button
          type={'primary'}
          disabled={inProgress}
          loading={inProgress}
          onClick={onGetRewardsClick}>
          Get Rewards
        </Button>
      </Box>
      <Box margin={{ top: '32px' }}>
        <Text>{status}</Text>
      </Box>
    </Box>
  </Box>
}
