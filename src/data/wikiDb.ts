import type { WikiDb } from '@/types';

export const wikiDb: WikiDb = {
  'heine-borel': {
    title: 'Heine–Borel Theorem',
    excerpt:
      'In metric spaces, a subset is compact iff it is closed and bounded. The theorem generalizes interval compactness to general Euclidean spaces.',
    badge: 'Evergreen',
    badgeClass: 'tag-badge-green',
  },
  tychonoff: {
    title: "Tychonoff's Theorem",
    excerpt:
      'Asserts that the product of any collection of compact topological spaces is compact. It is equivalent to the Axiom of Choice.',
    badge: 'Evergreen',
    badgeClass: 'tag-badge-green',
  },
  'axiom-of-choice': {
    title: 'Axiom of Choice',
    excerpt:
      "A foundational axiom in set theory asserting that the cartesian product of non-empty sets is non-empty. Equivalent to Zorn's Lemma.",
    badge: 'Seedling',
    badgeClass: 'tag-badge-yellow',
  },
  compactness: {
    title: 'Compactness',
    excerpt:
      'A property generalizing the concept of closed and bounded subsets to general topologies. Formally: every open cover contains a finite subcover.',
    badge: 'Evergreen',
    badgeClass: 'tag-badge-green',
  },
};
