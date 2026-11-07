export type GameIconName =
  | 'dialogue'
  | 'quest'
  | 'trade'
  | 'rest'
  | 'interaction'
  | 'bag'
  | 'map'
  | 'party'
  | 'settings'
  | 'history'
  | 'back'
  | 'person'
  | 'cube'
  | 'prosperity'
  | 'techLevel'
  | 'contamination'
  | 'threat'
  | 'chevronUp'
  | 'chevronDown'
  | 'previous'
  | 'next';
const paths: Record<GameIconName, string> = {
  prosperity:
    'M3 6a6 3 0 1 0 12 0 6 3 0 1 0-12 0Zm0 0v9c0 4 12 4 12 0V6M3 11c0 4 12 4 12 0M18 8c4 0 4 3 0 4m0 0c4 0 4 3 0 4m0 0c4 0 4 3 0 4',
  techLevel: 'M6 6h12v12H6ZM9 9h6v6H9ZM9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3M18 9h3m-3 6h3',
  contamination:
    'M10 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0ZM9 4a9 9 0 0 0-6 7h5l2-3Zm6 0a9 9 0 0 1 6 7h-5l-2-3ZM7 18a9 9 0 0 0 10 0l-3-4h-4Z',
  threat:
    'M9 18v3h6v-3h1a4 4 0 0 0 4-4V9a8 8 0 0 0-16 0v5a4 4 0 0 0 4 4h1ZM12 12l-1 3h2ZM7.5 10a1 1 0 1 0 2 0 1 1 0 1 0-2 0Zm7 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0Z',
  chevronUp: 'm6 15 6-6 6 6',
  chevronDown: 'm6 9 6 6 6-6',
  previous: 'm15 5-7 7 7 7',
  next: 'm9 5 7 7-7 7',
  dialogue: 'M20 11a8 8 0 0 1-8 7H7l-4 3 1-6a8 8 0 1 1 16-4Z',
  quest: 'm12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.5l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9Z',
  trade: 'm4 9 3-5h10l3 5M3 9h18l-2 11H5L3 9Zm5 3v5m4-5v5m4-5v5',
  rest: 'M3 19V6m0 9h18v4M3 10h5v5m0-5h9a4 4 0 0 1 4 4v1',
  interaction: 'm9 12-1-5a2 2 0 0 1 4-1l1 5 2-3 5 2-1 8-5 3-7-4-3-5 2-2 3 2',
  bag: 'M7 7V5a5 5 0 0 1 10 0v2M5 7h14l2 14H3L5 7Zm3 5h8v5H8Z',
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',
  party:
    'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-3a6 6 0 0 1 12 0v3m2-10a4 4 0 0 0 0-8m1 12a5 5 0 0 1 5 5v1',
  settings:
    'm9 3-1 3-3 1-2 4 2 2v3l3 2 1 3h6l1-3 3-2v-3l2-2-2-4-3-1-1-3H9Zm6 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  history: 'M3 4v6h6M4 9a8 8 0 1 1-1 7m9-10v6l4 2',
  back: 'm10 5-7 7 7 7M3 12h18',
  person: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM3 22a9 9 0 0 1 18 0',
  cube: 'm12 2 10 5v10l-10 5-10-5V7l10-5ZM2 7l10 5 10-5M12 12v10',
};
export function GameIcon({ name }: { name: GameIconName }) {
  return (
    <svg
      className="poiIcon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
