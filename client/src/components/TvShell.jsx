import TvControls from './TvControls';

function TvShell({ children }) {
  return (
    <div className="tv-shell">
      <div className="tv-screen">{children}</div>
      <TvControls />
    </div>
  );
}

export default TvShell;

