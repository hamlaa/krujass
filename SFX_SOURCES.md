# Sound-effect sources

Every runtime sound in this project is a **real recording from [Freesound](https://freesound.org)**
released under **Creative Commons 0 (CC0 1.0 Public Domain Dedication)**. CC0 allows copying, modifying,
redistributing and commercial use without asking permission. Attribution isn't required, but it is given
here anyway.

- **Licence check:** each sound's Freesound page was fetched on 2026-11-05 and confirmed to link to
  `creativecommons.org/publicdomain/zero/1.0/`. That URL is shown per file in `scripts/audio/sources.json`.
- **What was downloaded:** Freesound's high-quality MP3 previews (`…-hq.mp3`). Downloading the original WAV/FLAC
  files requires a logged-in account, so they were not used.
- **Processing:** done by `scripts/audio/build_sfx.py` (ffmpeg + numpy):
  - slicing at detected onsets or energy regions, with several variants per sound;
  - DC/rumble high-pass and short fades;
  - peak normalisation of one-shots to −3 dBFS;
  - RMS normalisation of loops, with a −3.5 dBFS ceiling;
  - seamless loops made with an equal-power crossfade and loop points stored in `src/audio/sfxManifest.ts`;
  - encoding to MP3: 96 kbps mono for one-shots, 128 kbps stereo for loops.
- **Output:** 115 files, about 1.5 MB, in `src/audio/samples/`. The app loads them only from its own server.
- **Not used:** Pixabay and Mixkit. Automated requests to Pixabay were refused (HTTP 403), and Freesound's CC0
  catalogue covered every need, which keeps the licensing uniform.

| Local files (`src/audio/samples/`) | Used in | Source recording | Creator | Licence |
|---|---|---|---|---|
| `loop_cart_wheels` | 1 · cart | [Shopping cart - wheels, slow speed.wav](https://freesound.org/people/SpliceSound/sounds/218329/) (#218329) | SpliceSound | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `loop_cart_rattle, cart_jolt_*` | 1 · cart | [shopping cart metal rattle push ext.flac](https://freesound.org/people/kyles/sounds/453553/) (#453553) | kyles | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `step_sneaker_*` | 1 · cart | [Footsteps, Tile, Male Sneakers, Slow Pace.wav](https://freesound.org/people/SpliceSound/sounds/170506/) (#170506) | SpliceSound | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `box_shift_*` | 1 · cart | [CardboardBoxes_01.wav](https://freesound.org/people/TheWAVLab/sounds/215475/) (#215475) | TheWAVLab | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `wood_rub_*` | 2 · beam, 6 · wardrobe (palms on wood) | [Wood Plank Scraping Close-Mic Long.aif](https://freesound.org/people/RutgerMuller/sounds/104013/) (#104013) | RutgerMuller | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `wood_creak_1` | 2 · beam | [Wood Creak Single V10](https://freesound.org/people/Rudmer_Rotteveel/sounds/506665/) (#506665) | Rudmer_Rotteveel | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `wood_creak_2…5` | 2 · beam | [Objects_WoodCreak_1.wav](https://freesound.org/people/SilentStrikeZ/sounds/389645/) (#389645) | SilentStrikeZ | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `cloth_1` | 1, 2, 3, 4 | [foley cloth rustle.wav](https://freesound.org/people/martian/sounds/19291/) (#19291) | martian | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `cloth_2, cloth_3` | 1, 2, 3, 4 | [Clothes Rustling 1](https://freesound.org/people/WasabiWielder/sounds/334219/) (#334219) | WasabiWielder | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `breath_m_*` | 2 · beam, 6 · wardrobe (exhale) | [heavy breathing while running](https://freesound.org/people/florianreichelt/sounds/456037/) (#456037) | florianreichelt | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `step_work_*` | 2 · beam, 6 · wardrobe (bracing feet) | [Footsteps on concrete](https://freesound.org/people/florianreichelt/sounds/459964/) (#459964) | florianreichelt | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `key_*, typing_*` | 3 · desk | [Keyboard Typing](https://freesound.org/people/Trollarch2/sounds/331656/) (#331656) | Trollarch2 | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `mouse_*` | 3 · desk | [Mouse Clicks.wav](https://freesound.org/people/joebro10/sounds/219318/) (#219318) | joebro10 | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `chair_*` | 3 · desk | [$ Office chair - creaky.wav](https://freesound.org/people/kennydoug/sounds/464252/) (#464252) | kennydoug | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `mug_*` | 3 · desk | [Ceramic_Mug_Cup.wav](https://freesound.org/people/Jamitch2/sounds/344704/) (#344704) | Jamitch2 | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `paper_*` | 3 · desk | [rustling paper.wav](https://freesound.org/people/keweldog/sounds/181774/) (#181774) | keweldog | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `loop_office` | 3 · desk (room tone) | [Room Tone Office 13](https://freesound.org/people/mzui/sounds/203306/) (#203306) | mzui | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `step_stair_*` | 4 · stairs | [Stairs](https://freesound.org/people/Poligonstudio/sounds/392604/) (#392604) | Poligonstudio | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `bag_*` | 4 · stairs | [Handbag on Bed_Light_Near_Mono](https://freesound.org/people/_stubb/sounds/406579/) (#406579) | _stubb | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `breath_f_*` | 4 · stairs | [Breath_Woman.wav](https://freesound.org/people/audione/sounds/108160/) (#108160) | audione | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `(downloaded, not used: too uneven for a loop)` | — | [Rolling suitcase 1](https://freesound.org/people/Aurelon/sounds/423707/) (#423707) | Aurelon | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `loop_case_wheels, case_bump_*` | 5 · suitcase | [Luggage wheels.wav](https://freesound.org/people/C-V/sounds/614104/) (#614104) | C-V | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `handle_*` | 5 · suitcase | [Suitcase handling and wheeling 01.wav](https://freesound.org/people/khenshom/sounds/479346/) (#479346) | khenshom | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `step_boot_*` | 5 · suitcase | [footsteps on surfaced road in boots](https://freesound.org/people/Frigus_XIII/sounds/456428/) (#456428) | Frigus_XIII | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `coat_*` | 5 · suitcase | [fabric rubbing / pulling](https://freesound.org/people/dynamique/sounds/554561/) (#554561) | dynamique | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `squeak_*` | 6 · wardrobe (foot friction) | [sneaker squeak rubber.wav](https://freesound.org/people/shakaharu/sounds/88502/) (#88502) | shakaharu | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `creak_deep_*` | 6 · wardrobe, door transition | [wood creaks heavy deep old armoir wardrobe closet door open close.wav](https://freesound.org/people/kyles/sounds/629942/) (#629942) | kyles | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `cabinet_rattle_*` | 6 · wardrobe | [Old and noisy wardrobe](https://freesound.org/people/nicola_ariutti/sounds/813235/) (#813235) | nicola_ariutti | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `strain_*` | 6 · wardrobe | [R15-34-Man Straining.wav](https://freesound.org/people/craigsmith/sounds/481737/) (#481737) | craigsmith | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `whoosh_short` | transitions, feedback pop-up | [Whoosh](https://freesound.org/people/qubodup/sounds/60013/) (#60013) | qubodup | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `whoosh_air` | transitions, title reveal | [Whoosh stereo light (transition)](https://freesound.org/people/xkeril/sounds/701104/) (#701104) | xkeril | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `whoosh_quick` | transitions, title exit, Play press | [quick woosh](https://freesound.org/people/florianreichelt/sounds/683101/) (#683101) | florianreichelt | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `title_boom` | chapter-title reveal | [Cinematic_Boom_Rhapsodize.wav](https://freesound.org/people/rhapsodize/sounds/255111/) (#255111) | rhapsodize | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `btn_*` | every button press | [wooden button](https://freesound.org/people/Troube/sounds/686544/) (#686544) | Troube | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `tick` | every button press | [Click.wav](https://freesound.org/people/kwahmah_02/sounds/256116/) (#256116) | kwahmah_02 | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `kalimba` | correct answer | [Kalimba (C-note)](https://freesound.org/people/foochie_foochie/sounds/331047/) (#331047) | foochie_foochie | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `shimmer` | chapter-title reveal | [Instrument_chimes_quick_soft.aif](https://freesound.org/people/vrodge/sounds/119543/) (#119543) | vrodge | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `woodblock` | incorrect answer, door transition | [wood block](https://freesound.org/people/thomasjaunism/sounds/218461/) (#218461) | thomasjaunism | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `page` | ถัดไป, feedback pop-up | [Page Turn](https://freesound.org/people/davidbain/sounds/136778/) (#136778) | davidbain | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |
| `sparkle` | correct answer | [wind chimes - single 04.wav](https://freesound.org/people/Anthousai/sounds/398496/) (#398496) | Anthousai | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/) |

Freesound is a project of the Music Technology Group, Universitat Pompeu Fabra.
To rebuild the samples run `python3 scripts/audio/build_sfx.py --download`, then `python3 scripts/audio/build_sfx.py`.
