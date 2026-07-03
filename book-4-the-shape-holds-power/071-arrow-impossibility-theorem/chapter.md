# 71. Arrow's impossibility theorem

> There is no fair way to turn many rankings into one — not because we have not yet found the rule, but because a proof says the rule cannot exist.

## The idea

Suppose a group of people must agree on a single ranking of three or more options — three candidates, three policies, three restaurants. Each person arrives with their own honest ordering of the options from best to worst. The group needs a rule, a procedure, that takes in everyone's individual rankings and returns one collective ranking that can be called the will of the group. We ask almost nothing of this rule beyond decency. It should work whatever preferences people happen to bring. If every single person prefers one option to another, the group's ranking should prefer it too. The group's verdict on any two options should depend only on how people feel about those two, not on some unrelated third option. And no one person should be a dictator whose ranking simply becomes the group's ranking regardless of what anyone else wants.

These four conditions sound like the minimum you would demand of any honest election. Kenneth Arrow proved, in 1951, that they cannot all hold at once. For three or more options, the only rule that satisfies the first three conditions in every possible case is one that violates the fourth — a dictatorship. Put the other way: every rule that treats no one as a dictator will, for some configuration of honest preferences, betray one of the other principles. There is no perfect aggregator of rankings. Not one that is hard to find. One that is provably impossible.

This is not a claim about corrupt elections or bad ballot design. It is a theorem, as certain as anything in mathematics, and its target is the concept most of us assume sits solidly beneath democracy: that there exists, in principle, a coherent thing called "what the group wants," waiting to be read off from what its members want. Arrow's result says that for preferences over many options, that thing may not exist at all.

## The origin

Kenneth Joseph Arrow (1921–2017) was a young economist, not yet thirty, when he stumbled into the problem that would carry his name. The book is *Social Choice and Individual Values*, published in 1951 out of his doctoral work at Columbia and the RAND Corporation, where the Cold War institution had grown interested in whether the preferences of a nation could be defined coherently enough to be reasoned about at all. Arrow had gone looking for a social welfare function — a principled way to combine the desires of many individuals into a collective ordering that a planner or a democracy could then try to satisfy. What he found instead was that the object he sought could not be built.

The result won him the Nobel Memorial Prize in Economics in 1972, shared with John Hicks; at fifty-one he remains, as of this writing, the youngest person to have received it. But the theorem's roots run back more than a century and a half, to the very figure who anchors the mathematics of the wise crowd in this series. In 1785 the Marquis de Condorcet, in the same *Essai* that gave us the Jury Theorem (item 18), noticed a second and stranger thing. When a group votes on three or more options by comparing them two at a time, the majority's preferences can form a loop. The group can prefer A to B, and B to C, and yet also prefer C to A — an intransitive collective preference assembled entirely out of individuals whose own preferences are perfectly transitive and sane. Condorcet had found the paradox. Arrow, a century and a half later, proved that the paradox was not a curiosity of one voting method but the shadow of something unavoidable in all of them.

## The mechanism

Start with Condorcet's loop, because it is the seed of everything, and it is best met as a worked example rather than a formula.

Three voters — call them 1, 2, and 3 — must rank three candidates, A, B, and C. Their honest preferences are these:

- Voter 1: A over B over C.
- Voter 2: B over C over A.
- Voter 3: C over A over B.

Each of these three orderings is entirely rational. No voter is confused or inconsistent; each has a clear favourite, a clear second, a clear worst. Now let the group decide by majority vote, comparing the candidates in pairs, the way any fair contest would.

A against B: voters 1 and 3 both rank A above B, voter 2 does not. A wins, two to one.
B against C: voters 1 and 2 both rank B above C, voter 3 does not. B wins, two to one.
C against A: voters 2 and 3 both rank C above A, voter 1 does not. C wins, two to one.

Read that back. The group prefers A to B, and B to C, and C to A. Every candidate loses to another candidate in a head-to-head majority vote. There is no winner, no coherent ranking, no bottom and no top — the group's preference chases its own tail. And nothing has gone wrong with the voters. The incoherence is manufactured, out of nothing but transitive individual preferences, by the act of aggregation itself. This is the Condorcet paradox, and it means that "the majority's preference" is not always a well-defined thing.

A natural hope is that this is a flaw peculiar to pairwise majority voting, curable by choosing some cleverer rule — a points system, a runoff, an instant-runoff, whatever. Arrow's theorem is the demolition of that hope. He did not test rules one by one. He specified the properties any acceptable rule should have and proved that the set is contradictory. The four conditions, stated plainly:

**Unrestricted domain.** The rule must produce a valid collective ranking for every logically possible profile of individual preferences. You do not get to declare awkward inputs off-limits.

**Pareto, or unanimity.** If every individual prefers A to B, the collective ranking must prefer A to B. The group cannot contradict a truly unanimous view.

**Independence of irrelevant alternatives.** The group's ranking of A against B must depend only on how individuals rank A against B — not on where anyone places some third option C. Introducing or removing a losing candidate must not flip the order of the two that remain.

**Non-dictatorship.** There is no single individual whose strict preference always becomes the group's, no matter what everyone else prefers.

Arrow's proof shows that any rule satisfying unrestricted domain, Pareto, and independence of irrelevant alternatives, for every case, with three or more options, must be a dictatorship — there must exist one person whose preferences the rule simply copies. Impose fairness on three fronts and the fourth collapses. The Condorcet loop is the local symptom; Arrow's theorem is the diagnosis that the disease has no cure within the family of rank-based rules.

## The anchor example

The memory hook is the loop itself, told once more as a scene, because its impossibility is easier to feel than to formalise. Imagine three friends deciding where to eat: Italian, Japanese, Thai. The first prefers Italian, then Japanese, then Thai. The second prefers Japanese, then Thai, then Italian. The third prefers Thai, then Italian, then Japanese. They are civilised people and decide to vote, two against one, on each pairing.

Italian beats Japanese — two of them prefer it. Japanese beats Thai — two of them prefer it. Surely, then, Italian beats Thai. But no: two of them prefer Thai to Italian. The group majority-prefers Italian to Japanese to Thai to Italian, in an endless circle. There is no meal the group can be said to want. Whichever restaurant someone proposes, a majority would rather be somewhere else.

Now notice the lever this hands to whoever runs the vote. Suppose the friends decide pairings in sequence, keeping the winner. If they start Italian-versus-Japanese and pit the winner against Thai, Thai wins the night. If they start Japanese-versus-Thai and bring in Italian, Italian wins. If they start Thai-versus-Italian and bring in Japanese, Japanese wins. The same three people, the same honest preferences, and yet the outcome is fixed entirely by the order in which the questions are asked — by the agenda. No one has cheated. The chooser of the agenda has simply exploited a cycle that Arrow proved cannot be legislated away. This is the whole theorem in a single dinner: when preferences cycle, "the will of the group" is not discovered by the procedure, it is created by it.

## The flip

This is the ceiling of the wise crowd, and it must be read directly against the floor. Condorcet's Jury Theorem (item 18), the mathematical nail this series hangs on, showed that a crowd of the modestly competent can be nearly infallible — but only on a binary question with a right answer, where enough independent votes drive the majority toward truth. Arrow's theorem is that same crowd asked to do something the Jury Theorem never promised: to rank three or more options where there is no truth to converge on, only preferences to combine. And here the crowd's power runs out. Not because the crowd is foolish, but because the task itself has no perfect solution. Where Condorcet's binary question has a correct answer that aggregation can find, Arrow's multi-option ranking has only tastes, and tastes assembled by any fair rule can be made to contradict themselves.

This is why aggregation — Surowiecki's fourth condition (item 20), the final gear that turns many private judgments into one public verdict — is not merely fragile but, for preferences over many options, provably imperfect. The diversity prediction theorem (item 19) escapes Arrow precisely because it aggregates *estimates* of something true, and error can be averaged away toward a real answer; there is a right number the crowd converges on. Strip out the right answer, leave only rankings of what people want, and no averaging saves you. The consensus/majority/quorum machinery of item 70 assumes a coherent group will exists to be measured; Arrow says that for rich enough choices it may not exist at all. "The will of the people," invoked as though it were a single object waiting to be counted, may be a category error — a phrase that presumes a coherent collective ranking that the mathematics forbids. The wise crowd is real, and it is bounded, and this theorem draws one edge of the boundary. It is the twin of Condorcet in the deepest sense: the same crowd, the same aggregation, meeting the limit that the binary case hid.

## The human weight

The frontier here is medium and sober, and it cuts against two opposite illusions at once. Arrow tempers the utopian claim — that a good enough democratic procedure perfectly channels the popular will — by showing that no such procedure exists for ranked choices among many options. But he equally refuses the cynic's conclusion that democracy is therefore a fraud. The theorem is a limit, not a refutation. What it relocates is *where the power lives*.

If there is no perfect aggregation, then the procedure itself, and whoever controls it, carries real and often invisible weight. The dinner made this concrete: agenda-setting power is the power to pick which of several cyclic outcomes becomes the answer, by choosing the order and framing of the votes. A committee chair who decides which amendments are paired against which, and in what sequence, can often steer a body of people to a result that a differently-ordered agenda would have reversed — with no one lying and no rule broken. Legislative history is full of this: killer amendments, strategic sequencing, the artful choice of what gets voted on first. Arrow's theorem is the reason these levers exist. Because the collective ranking is truly indeterminate when preferences cycle, someone must break the tie, and that someone is whoever holds the procedure.

The honest lesson is a caution in both directions. It warns against naive majoritarianism — the confident announcement that an outcome is simply "what the people wanted," when a different but equally fair procedure would have produced a different outcome from the identical preferences. And it warns against the mirror-image cynicism that treats every outcome as pure manipulation. The truth sits between: the crowd's preferences are real, the aggregation is imperfect, and the gap between them is a space where structure and power operate. That is not a failure of democracy. It is the shape of the thing, and knowing its shape is the beginning of not being fooled by anyone who claims to speak for a will that does not, in the required sense, exist.

## The critique

Arrow's theorem is exact, but its reach is narrower than the sweeping headlines suggest, and honesty requires marking the boundaries.

The most-argued condition is **independence of irrelevant alternatives**, which many hold to be too strong. It forbids the rule from using any information about intensity or the full shape of preference when ranking two options — only the bare A-versus-B ordering may count. But a great deal of information lives in *how much* people prefer things, not merely in the order. Cardinal and range-voting methods, where voters score options on a scale rather than merely ranking them, deliberately relax independence of irrelevant alternatives by admitting that intensity data, and can thereby escape Arrow's trap — at the cost of new problems, since scores invite exaggeration and strategic scoring. Arrow's theorem is a theorem about *ordinal* preferences, about rankings and nothing more; it does not bind every conceivable aggregation.

Second, the theorem applies to preferences, not to estimates. Tasks with a verifiable right answer — Galton's ox-weight crowd (item 17), any question where the group is trying to guess a truth rather than express a taste — sit entirely outside Arrow's domain, because there the "aggregation" is averaging toward a fact, not combining incompatible wants. This is why the wise-crowd results survive Arrow intact: they were never about ranking preferences in the first place.

Third, real electorates are often not adversarial in the way the worst case requires. Duncan Black showed in 1948 that if voters' preferences are **single-peaked** — if the options fall along a single dimension, like left-to-right on a spectrum, and each voter has one ideal point with declining enthusiasm as options move away from it — then the Condorcet cycle vanishes and a stable majority winner exists: the choice preferred by the median voter. Black's median voter theorem means the pathology Arrow generalised is a feature of *unrestricted* preferences; restrict the domain to something realistic and coherent majorities often reappear. Whether real preferences are single-peaked is an empirical question, and frequently they are close enough.

Related results sharpen rather than soften the picture. The Gibbard–Satterthwaite theorem (Gibbard 1973; Satterthwaite 1975) showed that every reasonable non-dictatorial voting rule over three or more options is vulnerable to strategic manipulation — voters can sometimes get a better result by misrepresenting their preferences — which is Arrow's impossibility reappearing in the language of honesty rather than coherence. And Amartya Sen's 1970 "The Impossibility of a Paretian Liberal" proved a cousin result: no rule can simultaneously honour unanimity and even a minimal commitment to individual liberty over private matters. The family of impossibility theorems is large, and together they say something disciplined and non-cynical. Not that democracy is worthless, but that no aggregation rule is perfect — that every real procedure trades one virtue against another, and that the honest task is choosing which imperfection to live with, not pretending a flawless rule is waiting to be found. Arrow drew the ceiling. He did not tear down the house.
