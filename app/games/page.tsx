import { getGamesWithBest } from "@/app/data/queries";
import { GameGrid } from "@/app/components/game-grid";

export default async function Home() {
  const games = await getGamesWithBest();

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      <GameGrid games={games} />
    </div>
  );
}
