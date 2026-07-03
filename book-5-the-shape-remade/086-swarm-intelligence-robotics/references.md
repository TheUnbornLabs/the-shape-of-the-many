# References — 86. Swarm intelligence & swarm robotics

## Confirmed sources

- Dorigo, Marco. *Optimization, Learning and Natural Algorithms* (PhD thesis, in Italian: *Ottimizzazione, apprendimento automatico, ed algoritmi basati su metafora naturale*). Politecnico di Milano, 1992. — The doctoral thesis introducing Ant Colony Optimisation and the Ant System algorithm; the founding work turning stigmergy into an optimisation method.
- Dorigo, Marco, Vittorio Maniezzo and Alberto Colorni. "Ant System: Optimization by a Colony of Cooperating Agents." *IEEE Transactions on Systems, Man, and Cybernetics — Part B*, vol. 26, no. 1, 1996, pp. 29–41. — The peer-reviewed presentation of the Ant System; supports the mechanism (pheromone laying, evaporation, positive feedback) and applications to the travelling salesman problem.
- Kennedy, James and Russell Eberhart. "Particle Swarm Optimization." *Proceedings of the IEEE International Conference on Neural Networks*, 1995, pp. 1942–1948. — The paper introducing Particle Swarm Optimisation; supports the boid-inspired model of particles pulled toward personal-best and swarm-best positions.
- Bonabeau, Eric, Marco Dorigo and Guy Theraulaz. *Swarm Intelligence: From Natural to Artificial Systems*. Oxford University Press / Santa Fe Institute Studies in the Sciences of Complexity, 1999. — The field-defining book laying out social-insect behaviour as a design library for distributed problem-solving; supports the origin narrative and the robust/scalable/decentralised framing.
- Rubenstein, Michael, Alejandro Cornejo and Radhika Nagpal. "Programmable Self-Assembly in a Thousand-Robot Swarm." *Science*, vol. 345, no. 6198, 2014, pp. 795–799. — The Kilobots demonstration; supports the anchor example (a thousand simple robots self-assembling into shapes using only local communication, with no central controller).
- Reynolds, Craig W. "Flocks, Herds and Schools: A Distributed Behavioral Model." *Computer Graphics (SIGGRAPH '87 Proceedings)*, vol. 21, no. 4, 1987, pp. 25–34. — The boids model underpinning Particle Swarm Optimisation's flocking inspiration (cross-referenced as item 3).

## Further reading to verify before final publication

- Rubenstein, Cornejo & Nagpal (2014), *Science* citation details — **confirmed**: vol. 345, no. 6198, pp. 795–799 (DOI 10.1126/science.1254295); the swarm comprised 1,024 Kilobots, rounded to "a thousand" in the text.
- Dorigo 1992 thesis exact title and whether cited by its Italian or English rendering — confirm the canonical citation form. **Further reading to verify before final publication.**
- Kennedy & Eberhart 1995 page range (1942–1948) — **confirmed** against the IEEE ICNN '95 proceedings (Proc. IEEE Int. Conf. Neural Networks, vol. 4, pp. 1942–1948).
- Kilobot hardware specifics — **confirmed** against Rubenstein et al. 2014 and coverage of the Kilobot platform: coin/quarter-sized robot on three rigid legs, moving via two vibration motors; infrared transmitter/receiver for local neighbour communication and proximity sensing; shapes demonstrated include a star, a wrench and the letter "K"; assembly took roughly half a day (~12 hours). The chapter's "many hours" is a safe hedge on that figure.
- The characterisation of ACO/PSO as metaheuristics that can be matched or beaten by conventional optimisers, and the "no free lunch" caution (Wolpert & Macready 1997) — a specific supporting citation for the critique beat should be added. **Further reading to verify before final publication.**
- Governance framing of lethal autonomous weapon swarms and "meaningful human control" (e.g. UN CCW Group of Governmental Experts discussions) — add a specific authoritative source before final publication. **Further reading to verify before final publication.**

## Cross-references (internal, to the series)

- Item 1 (Emergence), Item 2 (Self-organisation), Item 3 (Boids), Item 4 (Stigmergy), Item 5 (Feedback loops) — the mechanisms swarm engineering deliberately builds on.
- Item 20 (Surowiecki's four conditions), Item 68 (Honeybee democracy) — the constructive/leaderless-optimum pole.
- Item 29 (Crowd crushes), Item 40 (Bystander effect / diffusion of responsibility) — the dark twin and the accountability frontier.
