import { MENU_AUDIO_ID, RACE_TRACKS } from './race-audio';
import { menuPlaybackBootstrap } from './menu-preload-script';

// Parsed before the game bundle: download and first-gesture playback don't wait for hydration.
export function MenuMusicPreload() {
  return (
    <>
      <audio id={MENU_AUDIO_ID} src={RACE_TRACKS.menu} preload="auto" loop hidden />
      <script dangerouslySetInnerHTML={{ __html: menuPlaybackBootstrap }} />
    </>
  );
}
