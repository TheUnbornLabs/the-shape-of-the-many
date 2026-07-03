# References — 24. Ensemble methods & random forests

## Confirmed sources

- Breiman, Leo. "Bagging predictors." *Machine Learning* 24 (2): 123–140, 1996. — The founding paper on bootstrap aggregating; establishes that averaging models trained on bootstrap resamples reduces variance, especially for unstable learners like decision trees.
- Breiman, Leo. "Random Forests." *Machine Learning* 45 (1): 5–32, 2001. — Introduces the random forest; adds random feature selection at each split to decorrelate the trees, and bounds forest error in terms of individual tree strength and inter-tree correlation.
- Freund, Yoav, and Robert E. Schapire. "A decision-theoretic generalization of on-line learning and an application to boosting." *Journal of Computer and System Sciences* 55 (1): 119–139, 1997. — The AdaBoost paper; sequential training in which each model focuses on the errors of its predecessors.
- Schapire, Robert E. "The strength of weak learnability." *Machine Learning* 5 (2): 197–227, 1990. — Proves that a weak learner (slightly better than chance) can be boosted into a strong one; the theoretical origin of boosting.
- Dietterich, Thomas G. "Ensemble methods in machine learning." In *Multiple Classifier Systems* (Lecture Notes in Computer Science, vol. 1857), Springer, 2000, pp. 1–15. — Survey establishing ensembles as a settled pillar of the field; discusses why diversity among base learners is essential.
- Kearns, Michael, and Leslie Valiant. "Cryptographic limitations on learning Boolean formulae and finite automata." *Journal of the ACM* 41 (1): 67–95, 1994 (question originally posed 1988). — Source of the weak-vs-strong learnability question that motivated boosting.

## Further reading to verify before final publication

- Netflix Prize (2009): the winning "BellKor's Pragmatic Chaos" solution was a large blended ensemble of many models. — General facts (competition ran 2006–2009, $1M prize, winning solution was a blend) are well documented; verify the exact composition/team wording before citing specifics.
- The claim that correlated risk models contributed to the 2008 financial crisis is broadly supported (e.g., shared reliance on similar mortgage-default and copula models), but the specific framing as "model monoculture" is the author's; verify against a named source (e.g., work on the Gaussian copula, Salmon 2009 *Wired*, or FCIC report) before final publication.
- The characterisation of gradient boosting as "one of the most dominant predictive tools in modern practice" and the claim that ensembles "dominate Kaggle competitions" are widely held but should be pinned to a citable source or softened before publication.
- Breiman's biographical dates (1928–2005) and career details (Berkeley statistician, prior consulting work) — verify against an authoritative obituary or biography.
- The variance-of-correlated-average decomposition (a shrinking term plus a correlation-floor term) is standard; cite a textbook (e.g., Hastie, Tibshirani & Friedman, *The Elements of Statistical Learning*) in the final pass.
