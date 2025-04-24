import {PortfolioPage} from "./pages/portfolio";
import {darkTheme} from "./theme/grommet.ts";
import {ConfigProvider} from "antd";
import {Grommet} from "grommet";
import {antdTheme} from "./theme/antd.ts";

function App() {
  return <Grommet theme={darkTheme} themeMode={'dark'} full>
    <ConfigProvider theme={antdTheme}>
      <PortfolioPage />
    </ConfigProvider>
  </Grommet>
}

export default App
