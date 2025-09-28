/**
 * A hidden SVG sprite sheet containing all map icon definitions.
 * Render this component once at the top level of your app.
 * Icons inside use `fill="currentColor"` to be colorable via CSS `color` property.
 */
export const MapIconDefs = () => {
  return (
    <svg style={{ display: 'none' }} aria-hidden="true">
      <defs>
        <symbol id="icon-party" viewBox="0 0 100 100">
          <path d="M50 10 L90 90 L10 90 Z" fill="currentColor" />
        </symbol>

        <symbol id="icon-base" viewBox="0 0 100 100">
          <path d="M50 10 L10 40 L10 90 L90 90 L90 40 Z" fill="currentColor" />
          <path d="M35 90 L35 60 C35 50, 65 50, 65 60 L65 90" fill="currentColor" />
        </symbol>

        <symbol id="icon-settlement" viewBox="0 0 100 100">
          <rect x="20" y="50" width="60" height="40" fill="currentColor" />
          <path d="M10 50 L50 20 L90 50 Z" fill="currentColor" />
        </symbol>

        <symbol id="icon-battle" viewBox="0 0 100 100">
          <path d="M10 10 L90 90 M90 10 L10 90" stroke="currentColor" stroke-width="15" />
        </symbol>

        <symbol id="icon-boss" viewBox="0 0 100 100">
          <path
            d="M20 80 C 20 20, 80 20, 80 80 M40 50 Q 50 60 60 50 M30 30 L40 40 M70 30 L60 40"
            stroke="currentColor"
            stroke-width="10"
            fill="none"
          />
        </symbol>
      </defs>
    </svg>
  );
};
