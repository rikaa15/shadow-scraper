### Liquidity calculation

https://uniswapv3book.com/milestone_1/calculating-liquidity.html

### Example of calculation token1 amount based of token0 amount and ticks range

#### Initial conditions
```
Pa = 1.0005 (lower tick)

P = 1.001 (current tick)

Pb = 1.003 (upper tick)

x = 10 (token0 amount)

Goal: calculate y (token1 amount)
```

<img width="1853" alt="Screenshot 2025-03-31 at 2 10 22 PM" src="https://github.com/user-attachments/assets/81b8f718-a4de-4bdb-a3f8-cb1e7b0fb3a5" />

Formulas for the active liquidity range [Pa, Pb]:

```
L = x * S(Pb) * S(Pc) / (S(Pb) - S(Pc))
L = y / (S(Pc) - S(Pa))
```

<img width="1235" alt="Screenshot 2025-03-31 at 3 05 49 PM" src="https://github.com/user-attachments/assets/2781b077-7394-4460-b852-07703236c1fe" />

L should be equal in both expressions, so we can find y (token1 amount)

Let's use S() instead of sqrt() for short

#### 1) Compute Liquidity using x (token0)

```
S(Pc) = S(1.001) ≈ 1.000499875
S(Pa) = S(1.0005) ≈ 1.0002499375
S(Pb) = S(1.003) ≈ 1.001498127

L = x * S(Pb) * S(Pc) / (S(Pb) - S(Pc))

L = 10 * (1.001498127 * 1.000499875) / (1.001498127 - 1.000499875) = 10 * (1.001997749 / 0.000998252) = 10037.52
```

#### 2) Solve for y (token1) using computed liquidity (L)

L = y / (S(Pc) - S(Pa))

Rearrage for y:

y = L * (S(Pc) - S(Pa))

L = 10037.52
S(Pc) = 1.000499875
S(Pa) = 1.0002499375
S(Pc) - S(Pa) = 1.000499875 - 1.0002499375 = 0.0002499375

y = 10037.52 * 0.0002499375 = 2.508752655 ≈ 2.5

#### Result

Esimated token1 amount = 2.5 which matched with dashboard estimation
