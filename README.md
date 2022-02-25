# Round all the things: XKCD 2585 Implemented &#x23F9; &#x23FA;

[![](https://imgs.xkcd.com/comics/rounding.png)](https://xkcd.com/2585/)

<sup>&#xa9; Randall Monroe, 2022</sup>

Pulling any number of any number by repeatedly cramming one into a bunch of units and rounding until it starts looking like the other.

**Try it out at <https://rounding.lam.io>!**

## Technical Overview

This is a fairly straightforward use of the [Wikipedia Convert module's database of units](https://en.wikipedia.org/wiki/Module:Convert/data), which I reused from a previous project ([phrase2unit: Implementing XKCD 2312](https://github.com/acrylic-origami/phrase2unit/)). All this is doing is a greedy linear search of all units that match the input kind, which is sparse enough (<100k entries) that this isn't very expensive. In fact sparsity is a big problem with the original dataset, which doesn't fill the real line enough to converge for most pairs of numbers and units. Since units can be arbitrarily combined, the live implementation uses a cross product of all units in the base Wikipedia database (and their reciprocals), which gives decent performance and coverage at the expense of some very weird-looking but valid units.

This cross-product is done in a messy [sorry!] Jupyter notebook in `prep/` generated into `prep/unit_combos.csv`, which is copied into postgres via `\copy` (see [setup.sql](setup.sql)). After these are shuttled to the database, `server.py` repeatedly queries all the units for the one that will approach the target the quickest, and that's pretty much it.

Optimizations are difficult, especially within the constraints of an RDBMS. Since where the 0.5 cliffs land depends so wildly on the input, it's pretty much impossible to make any pre-built indexing structure that will serve all inputs. It is possible to progressively search for ranges (e.g. to increment, to look for numbers that will generate 0.5-1, then 1.5-2, etc.) although finding numbers that land in lower ranges won't necessarily be the fastest to advance since landing at say 0.99 has much smaller gains than landing at 20.5. If there were much larger inputs and search spaces it might be worth doing this progressive search and finding a reasonably threshold but for now with this set of units brute force is actually not bad and has minimal overhead.