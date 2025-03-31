### Liquidity calculation

https://uniswapv3book.com/milestone_1/calculating-liquidity.html

Pa = 1.0005 (lower tick)
P = 1.001 (current tick)
Pb = 1.003 (upper tick)
x = 10 (token0 amount)
Goal: calculate y (token1 amount)

Formaulas for the active liquidity range [Pa - Pb]:
L = x * S(Pb) * S(Pc) / (S(Pb) - S(Pc))
L = y / (S(Pc) - S(Pa))

L should be equal in both expressions, so we can find y (token1 amount)

Let's use S() instead of sqrt() for short

1) Compute Liquidity using x (token0)

S(Pc) = S(1.001) ≈ 1.000499875
S(Pa) = S(1.0005) ≈ 1.0002499375
S(Pb) = S(1.003) ≈ 1.001498127

L = x * S(Pb) * S(Pc) / (S(Pb) - S(Pc))

L = 10 * (1.001498127 * 1.000499875) / (1.001498127 - 1.000499875) = 10 * (1.001997749 / 0.000998252) = 10037.52

2) Solve for y (token1) using computed liquidity (L)

L = y / (S(Pc) - S(Pa))

Rearrage for y:

y = L * (S(Pc) - S(Pa))

L = 10037.52
S(Pc) = 1.000499875
S(Pa) = 1.0002499375
S(Pc) - S(Pa) = 1.000499875 - 1.0002499375 = 0.0002499375

y = 10037.52 * 0.0002499375 = 2.508752655 ≈ 2.5
