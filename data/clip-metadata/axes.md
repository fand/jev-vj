# 評価軸一覧

76軸。うち今回の説明で値が得られたものは67軸。

nullは「不明」。タグ配列も不明ならnull。falseは明確な否定がある場合のみ。

| 属性 | 意味 | 型・値 | 記入あり / 111 |
| --- | --- | --- | --- |
| `color.palette` | 色パレット：言及された色。面積の順位は付けない | tags | 91 |
| `color.dominant` | 主色：主色・背景色として明示された色 | tags | 5 |
| `color.accent` | アクセント色：アクセント・一部分として明示された色 | tags | 5 |
| `color.background` | 背景・環境色：物体の色や光源色と区別 | tags | 19 |
| `color.surface` | 表面色：物体・地面など表面自体の色 | tags | 26 |
| `color.emission` | 発光色：ネオン・発光模様・光源の色 | tags | 43 |
| `color.illumination` | 照明色：物体に当たる光や反射光の色 | tags | 10 |
| `color.mode` | 色の構成：明示された単色・白黒・RGB・多色 | single_hue, grayscale, rgb, multicolor | 18 |
| `color.temperature` | 色温度の傾向：色名からの定性的な整理。実測値ではない | warm, cool, mixed, neutral | 62 |
| `color.brightness` | 全体の明暗：画面全体の明暗が記述されている場合 | dark, light, mixed | 2 |
| `color.saturation` | 彩度：画面全体の彩度が記述されている場合 | low, medium, high | 0 |
| `content.subjects` | モチーフ：描かれている対象の英語タグ | tags | 102 |
| `content.setting` | 舞台・空間：トンネル・街・部屋など | tags | 51 |
| `content.style` | 表現・ジャンル：sci_fi・abstract・retro_gameなど | tags | 29 |
| `content.realism` | 写実性：realistic等が明示された場合 | realistic, stylized | 15 |
| `content.dimension` | 画面の次元：2D/3Dが明示された場合。立体表現の推定はしない | 2d, 3d | 10 |
| `content.human_form` | 人体モチーフ：顔や人型があるとの記述 | boolean | 2 |
| `content.organic` | 有機的な形：有機的という明示的な形容 | boolean | 1 |
| `geometry.shapes` | 幾何形状：円・三角形・直方体など | tags | 53 |
| `geometry.tunnel_section` | トンネル断面：円形・四角形・六角形など | tags | 9 |
| `geometry.topology` | 構造：重層・同心・開口・トーラス等 | tags | 8 |
| `geometry.surface_relief` | 表面の起伏：凸凹・波打ち・段差等 | tags | 6 |
| `material.types` | 材質：金属・岩・煙・液体等 | tags | 31 |
| `material.finish` | 表面仕上げ：鏡面・マット等 | tags | 3 |
| `material.transparency` | 物体の透過性：素材の見え方。動画のalphaチャンネルとは別 | transparent, translucent, opaque | 3 |
| `texture.patterns` | 模様：ストライプ・グリッド・ドット等 | tags | 24 |
| `texture.noise_family` | ノイズ種別：明示された名称。おそらく等の推測はreview_notesへ | tags | 3 |
| `composition.layout` | 配置：中央・床と天井・円形配置等 | tags | 30 |
| `composition.symmetry` | 対称性：左右・上下など明示された対称 | tags | 4 |
| `composition.repetition` | 反復配置：等間隔・ランダム配置等 | tags | 11 |
| `composition.grid` | グリッド寸法：行列数が明示されたもの。順序は文章で保持 | string | 1 |
| `composition.density` | 密度・個数感：多数・少数などの記述 | sparse, many, dense | 8 |
| `composition.coverage` | 画面の占有：全画面・大部分・部分等 | full_frame, large, partial | 3 |
| `composition.width_fraction` | 画面幅に対する比率：幅と明示されない80%等はここに数値化しない | number | 0 |
| `composition.scale` | 被写体の大きさ：巨大・小さいなど | tags | 9 |
| `composition.crop` | 見切れ・切り取り：下半分など画面内の切り取り方 | tags | 1 |
| `camera.viewpoint` | 視点：斜め見下ろし・左上・アイソメトリック等 | tags | 13 |
| `camera.fixed` | カメラ固定：固定が明示された場合。未記載はnull | boolean | 7 |
| `camera.translation` | カメラ移動方向：奥方向=forward_into_scene。画面上の物体の移動と別 | tags | 38 |
| `camera.translation_speed` | カメラ移動速度：slow/medium/fastの主観的な順序尺度 | slow, medium, medium_fast, fast | 39 |
| `camera.path` | カメラ経路：曲線・下降・被写体周回等 | tags | 9 |
| `camera.rotation_mode` | カメラ回転様式：rollと被写体周回orbitを区別。明示なしはunspecified | roll, orbit, unspecified | 11 |
| `camera.rotation_direction` | カメラ回転方向：ユーザーの時計回り表現を保持。座標系の実測なし | clockwise, counterclockwise, mixed, unspecified | 11 |
| `camera.rotation_axes` | カメラ回転軸：明示された軸のみ | tags | 0 |
| `camera.rotation_speed` | カメラ回転速度：並進速度と独立 | slow, medium, fast | 2 |
| `camera.speed_profile` | カメラの緩急：カメラについて明示された速度変化 | tags | 0 |
| `motion.types` | 動きの種類：回転・拡大縮小・変形・噴出など | tags | 59 |
| `motion.targets` | 動く対象：カメラ以外の何が動くか | tags | 56 |
| `motion.screen_direction` | 画面上の移動方向：上下左右・斜め・中央から外等 | tags | 17 |
| `motion.depth_direction` | 物体の奥行き移動：奥→手前/手前→奥。カメラと分離 | tags | 2 |
| `motion.subject_speed` | 物体の速度：カメラや点滅の速度と独立 | slow, medium, medium_fast, fast | 14 |
| `motion.rotation_direction` | 物体の回転方向：回転する主体が物体と分かるもの | clockwise, counterclockwise, mixed, unspecified | 6 |
| `motion.rotation_axes` | 物体の回転軸：X/Y/Z等 | tags | 4 |
| `motion.rotation_speed` | 物体の回転速度：単なる等速はconstantとしてprofileへ | slow, medium, fast | 5 |
| `motion.rotation_profile` | 物体回転の緩急：等速や加減速など | tags | 2 |
| `motion.speed_profile` | 物体移動の緩急：速→ほぼ停止等 | tags | 1 |
| `motion.deformation` | 形状変形：波打ち・うねりなど | tags | 3 |
| `motion.synchrony` | 動きの同期関係：全体一緒・別方向同速度・独立等 | tags | 3 |
| `motion.randomness` | 動きの不規則性：光のランダム点滅とは独立 | tags | 0 |
| `light.types` | 光の種類：ネオン・蛍光灯・点光源・オーラ等 | tags | 20 |
| `light.behaviors` | 光の変化：点滅・フェード・伝播・反射等 | tags | 56 |
| `light.speed` | 光の変化速度：カメラ速度と分離 | slow, medium, fast | 16 |
| `light.timing` | 発光の時間パターン：ランダム・ビートに沿う・独立等 | tags | 20 |
| `light.screen_direction` | 光の画面内移動：下→上・放射等 | tags | 5 |
| `light.depth_direction` | 光の奥行き移動：奥→手前など | tags | 2 |
| `light.intensity` | 発光強度：弱い・強い等。全体の明暗と別 | low, medium, high | 2 |
| `light.effects` | 光学表現：ストリーク・色収差・反射・発光等 | tags | 12 |
| `rhythm.beat_pattern` | ビート状の光アニメーション：ユーザーがビートに合わせた動きと説明。ライブ音声同期を保証しない | boolean | 8 |
| `rhythm.repeating_event` | 反復する出来事：扉が次々開く等 | tags | 5 |
| `rhythm.easing` | イージング：強弱や速度経過など | tags | 1 |
| `rhythm.phase_relation` | 位相・タイミング関係：部位ごとのタイミング差等 | tags | 6 |
| `rhythm.loop_description` | ループの記述：ユーザーが無限ループ等と言ったもの。シームレス実測なし | string | 1 |
| `technical.alpha` | 動画のalpha有無：ファイル名の_alphaや物体の透明さから推測しない | boolean | 0 |
| `technical.bpm` | 素材BPM：説明で数値が明示された場合のみ | number | 0 |
| `technical.seamless_loop` | シームレス性：継ぎ目がないとの明示が必要 | boolean | 0 |
| `technical.audio_reactive` | 外部音声への反応：ビート状という見た目から推測しない | boolean | 0 |
