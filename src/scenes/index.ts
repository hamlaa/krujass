import type { SceneId } from '../data/scenarios';
import type { SceneModule } from './common';
import { CartScene } from './CartScene';
import { WorkerScene } from './WorkerScene';
import { DeskScene } from './DeskScene';
import { StairsScene } from './StairsScene';
import { SuitcaseScene } from './SuitcaseScene';
import { WardrobeScene } from './WardrobeScene';

export const SCENE_MODULES: Record<SceneId, SceneModule> = {
  cart: CartScene,
  worker: WorkerScene,
  desk: DeskScene,
  stairs: StairsScene,
  suitcase: SuitcaseScene,
  wardrobe: WardrobeScene,
};
