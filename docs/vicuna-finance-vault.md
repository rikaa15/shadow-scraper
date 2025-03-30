#### Strategy

```
https://vicunafinance.com/markets
1. Select a market with a high lending rate and then borrow against it with a positive borrow rate. 
2. In our case, the collateral asset is USDC.e with 13% lending rate .
3. Borrow USDT for 3% against it at maximum LTV (80%)
4. Sell USDT for USDC.e (https://swap.defillama.com/?chain=sonic&from=0x0000000000000000000000000000000000000000&tab=swap&to=)  and repeat step 1-3 for 5 times
```

#### Initial balance

- 20 USDC.e (0x29219dd400f2bf60e5a23d13be72b486d4038894)
- 0 USDT (0x6047828dc181963ba44974801ff68e538da5eaf9)



#### Loop 1

Step 1: Deposit 20 USDC into a Vicuna Finance USDC vault

<img width="568" alt="Screenshot 2025-03-29 at 8 19 09 PM" src="https://github.com/user-attachments/assets/7e52da6e-9f6c-464c-ba6e-cc0b10709d65" />


Step 2: With an 80% LTV, borrow 16 USDT

<img width="586" alt="Screenshot 2025-03-29 at 8 20 17 PM" src="https://github.com/user-attachments/assets/3d72f0fd-0102-41cc-b4dc-d5a777d88c13" />

I'm paying 3% annual interest on the 16 USDT

Step 3: Sell USDT for USDC.e (https://swap.defillama.com/?chain=sonic&from=0x0000000000000000000000000000000000000000&tab=swap&to=)

16 USDT swapped to 16 USDC.e

https://sonicscan.org//tx/0xee9c7930e4de8797b8f7dc658f239fc50793f176493b22f7a40f4e5396be65bd

#### Loop 2: repeating the same steps from Loop 1

New Collateral: 16 USDC.e (from swapping USDT to USDC on previous step)

Borrow: 80% of 16 = 12.8 USDT

Swap: 12.8 USDT → 12.8 USDC.e

Total Collateral: 36 + 12.8 = 48.8 USDC.e

Total Debt: 16 + 12.8 = 28.8 USDT


#### Loop 3

New Collateral: 12.8 USDC.e

Borrow: 80% of 12.8 = 10.24 USDT

Swap: 10.24 USDT → 10.24 USDC.e

Total Collateral: 48.8 + 10.24 = 59.04 USDC.e

Total Debt: 28.8 + 10.24 = 39.04 USDT

#### Loop 4

New Collateral: 10.24 USDC.e

Borrow: 80% of 10.24 = 8.192 USDT

Swap 8.192 USDT → 8.21 USDC.e

Total Collateral: 59.04 + 8.21 = 67.25 USDC.e

Total Debt: 47.232 USDT

#### Loop 5

New Collateral: 8.21 USDC.e

Borrow: 80% of 8.21 = 6.568 USDT

Swap: 6.568 USDT → 6.56 USDC.e

Total Collateral: 67.25 + 6.56 = 73.81 USDC.e

Total Debt: 47.232 + 6.568 = 53.80 USDT

<img width="536" alt="Screenshot 2025-03-29 at 8 30 11 PM" src="https://github.com/user-attachments/assets/b078fe96-a880-40d9-bdcc-21c248efbce8" />

<img width="568" alt="Screenshot 2025-03-29 at 8 30 22 PM" src="https://github.com/user-attachments/assets/4207dadf-026e-4ed0-8f7c-62ae9a739774" />


### After 5 loops:

Total Collateral: 73.7856 USDC.e (earning 13%)

Total Debt: 53.7856 USDT (costing 3%)

### Profit Calculation

Earnings: 73.81 USDC.e × 13% = 9.5953 USDC.e/year

Cost: 53.84 USDT × 3% = 1.6152 USDT/year

Net Profit: 9.5953 - 1.6152 = 7.9801 USD/year

ROI: 7.9801 ÷ 20 = 39.90% annually





