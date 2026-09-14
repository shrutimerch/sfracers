import RaceGame from '../game/ui/race-game';
import { MenuMusicPreload } from '../game/audio/menu-preload';
export default function Home() {
  return (
    <>
      <MenuMusicPreload />
      <RaceGame />
    </>
  );
}
