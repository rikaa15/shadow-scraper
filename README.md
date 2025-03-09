## Shadow Exchange Scraper

### Overview

The Shadow Exchange Subgraph Scraper is a lightweight application designed to fetch and parse data from the Shadow Exchange subgraph (a GraphQL-based data source) and store it in a local SQLite database for efficient querying and analysis. This tool is ideal for developers, researchers, or analysts who need to work with Shadow Exchange data offline or integrate it into custom workflows.

### Features
- Data Retrieval: Connects to the Shadow Exchange subgraph endpoint to fetch real-time or historical data.
- Data Parsing: Processes GraphQL query responses into structured formats.
- SQLite Storage: Stores parsed data in a local SQLite database with a predefined schema.
- Lightweight: Minimal dependencies and simple setup.

### Installation
1. Clone the repository
```shell
git clone https://github.com/ArtemKolodko/shadow-scraper.git
cd shadow-scraper
```
2. Install dependencies:
```shell
npm install
```

### Usage
1. Run the scraper:
```shell
npm run dev
```
2. The script will:
- Query the Shadow Exchange subgraph
- Parse the response data
- Store the results in a SQLite database file (e.g., /export/shadow_export.db).
3. Check the `/export` folder


### Calculate TVL
```shell
npm install
npm run tvl
```

### Export to jsonl

[Read more](https://jsonlines.org/) about jsonl

```shell
npm install
npm run jsonl
```

### Subgraph API
[Example request](https://sonic.kingdomsubgraph.com/subgraphs/name/exp/graphql?query=%7B%0A++clMints%28%0A++++skip%3A0%2C%0A++++first%3A1%2C%0A++++orderDirection%3Adesc%2C%0A++++orderBy%3Atransaction__blockNumber%2C%0A++++where%3A%7B%0A++++++pool_%3A%7B%0A++++++++symbol%3A+%22wS%2FUSDC.e%22%0A++++++%7D%2C%0A++++++transaction_%3A%7B%0A++++++++blockNumber_gt%3A9999916%0A++++++%7D%0A++++%7D%0A++%29%7B%0A++++id%0A++++transaction+%7B%0A++++++id%0A++++%09blockNumber%0A++++++timestamp%0A++%7D%0A++++owner%0A++++sender%0A++++origin%0A++++amount0%0A++++amount1%0A++++token0+%7B%0A++++++id%0A++++++name%0A++++++symbol%0A++++%7D%0A++++token1+%7B%0A++++++id%0A++++++name%0A++++%7D%0A++++pool+%7B%0A++++++id%0A++++++symbol%0A++++%7D%0A++%7D%0A++clBurns%28%0A++++first%3A1%2C%0A++++orderDirection%3Adesc%2C%0A++++orderBy%3Atransaction__blockNumber%2C%0A++++where%3A%7B%0A++++++pool_%3A%7B%0A++++++++symbol%3A+%22wS%2FUSDC.e%22%0A++++++%7D%2C%0A++++++transaction_%3A%7B%0A++++++++blockNumber_gt%3A9999916%0A++++++%7D%0A++++%7D%0A++%29+%7B%0A+++++id%0A++++owner%0A++++origin%0A++++amount0%0A++++amount1%0A++++token0+%7B%0A++++++id%0A++++++name%0A++++%7D%0A++++token1+%7B%0A++++++id%0A++++++name%0A++++%7D%0A++++pool+%7B%0A++++++id%0A++++++symbol%0A++++%7D%0A++%7D%0A%7D#)
