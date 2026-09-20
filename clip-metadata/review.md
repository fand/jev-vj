# 記入済みクリップの属性

説明文のみを整理。動画の再解析・実測なし。不明は未記載。

## Ducky3D

### animation 1.mp4

> 青、単色、Party noise. 床と天井。カメラは奥へ。Medium speed.

Single-hue blue floor-and-ceiling scene described as "Party noise". Camera travels forward at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue |
| 色の構成 (`color.mode`) | single_hue |
| 舞台・空間 (`content.setting`) | floor_ceiling_space |
| 配置 (`composition.layout`) | floor_and_ceiling |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| 色温度の傾向 (`color.temperature`) | cool |

補足：Party noiseの意味は未確定。パーリンノイズ等には置換しない。

派生属性：color.temperature

### animation 2.mp4

> 青、単色、電気ビリビリ、カメラは奥へ、ハイスピード。

Single-hue blue electric crackling visual; camera moves forward fast.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue |
| 色の構成 (`color.mode`) | single_hue |
| モチーフ (`content.subjects`) | electricity |
| 表現・ジャンル (`content.style`) | electric |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | fast |
| 動きの種類 (`motion.types`) | electrical_crackling |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 3.mp4

> 赤、単色、電気ビリビリ。カメラは奥へ。カメラは半時計回りに回転。ハイスピード。

Single-hue red electric crackling visual. Fast forward camera movement with counterclockwise camera rotation.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | red |
| 色の構成 (`color.mode`) | single_hue |
| モチーフ (`content.subjects`) | electricity |
| 表現・ジャンル (`content.style`) | electric |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | fast |
| カメラ回転方向 (`camera.rotation_direction`) | counterclockwise |
| カメラ回転様式 (`camera.rotation_mode`) | unspecified |
| 動きの種類 (`motion.types`) | electrical_crackling |
| 色温度の傾向 (`color.temperature`) | warm |

補足：半時計回りを反時計回りとして正規化。回転軸は未記載。

派生属性：color.temperature

### animation 4.mp4

> 緑、単色、ビリビリ、カメラは奥へ、トンネル、凸凹のトンネル、ハイスピード。

Single-hue green, uneven tunnel with an electric crackling appearance. Camera travels forward fast.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | green |
| 色の構成 (`color.mode`) | single_hue |
| モチーフ (`content.subjects`) | electricity |
| 舞台・空間 (`content.setting`) | tunnel |
| 表面の起伏 (`geometry.surface_relief`) | uneven |
| 表現・ジャンル (`content.style`) | electric |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | fast |
| 動きの種類 (`motion.types`) | electrical_crackling |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 5.mp4

> 平面を斜め上から見下ろす。カメラを奥へ。灰色と赤と青。Medium speed.

Gray, red and blue plane viewed obliquely from above. Camera advances at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | gray, red, blue |
| モチーフ (`content.subjects`) | plane |
| 幾何形状 (`geometry.shapes`) | plane |
| 視点 (`camera.viewpoint`) | oblique_overhead |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| 色温度の傾向 (`color.temperature`) | mixed |

派生属性：color.temperature

### Animation 6.mp4

> 青とオレンジ、サイファイ、メタリック、カメラ奥へ、ミリアムスピード、カメラは半時計回りに回転。

Blue and orange metallic sci-fi scene. Camera advances at medium speed and rotates counterclockwise.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue, orange |
| 表現・ジャンル (`content.style`) | sci_fi |
| 材質 (`material.types`) | metal |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| カメラ回転方向 (`camera.rotation_direction`) | counterclockwise |
| カメラ回転様式 (`camera.rotation_mode`) | unspecified |
| 色温度の傾向 (`color.temperature`) | mixed |

補足：ミリアムスピードを文脈からmediumと解釈。半時計回り→反時計回り。

派生属性：color.temperature

### animation 7.mp4

> 青、アクセントはオレンジ。トーラストンネル。カメラは時計回りに回転。カメラは奥へ。ハイスピード。

Blue torus tunnel with orange accents. Camera advances fast and rotates clockwise.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue, orange |
| 主色 (`color.dominant`) | blue |
| アクセント色 (`color.accent`) | orange |
| 舞台・空間 (`content.setting`) | tunnel |
| モチーフ (`content.subjects`) | torus |
| 幾何形状 (`geometry.shapes`) | torus |
| 構造 (`geometry.topology`) | torus_tunnel |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | fast |
| カメラ回転方向 (`camera.rotation_direction`) | clockwise |
| カメラ回転様式 (`camera.rotation_mode`) | unspecified |
| 色温度の傾向 (`color.temperature`) | mixed |

派生属性：color.temperature

### animation 8.mp4

> 2D黄色、シマシマが右上から左下へゆっくり。

Yellow 2D stripes drift slowly from upper right to lower left.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | yellow |
| 画面の次元 (`content.dimension`) | 2d |
| 模様 (`texture.patterns`) | stripes |
| 動きの種類 (`motion.types`) | translation |
| 動く対象 (`motion.targets`) | stripes |
| 画面上の移動方向 (`motion.screen_direction`) | upper_right_to_lower_left |
| 物体の速度 (`motion.subject_speed`) | slow |
| 色温度の傾向 (`color.temperature`) | warm |

派生属性：color.temperature

### animation 9.mp4

> 青、ピクセルタイルがパカパカランダムに点滅。Medium speed

Blue pixel tiles flash randomly at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue |
| モチーフ (`content.subjects`) | pixel_tiles |
| 模様 (`texture.patterns`) | pixel_grid |
| 光の変化 (`light.behaviors`) | flashing |
| 光の変化速度 (`light.speed`) | medium |
| 発光の時間パターン (`light.timing`) | random |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 10.mp4

> 青、ピクセルタイルがパカパカランダムに点滅。ハイスピード

Blue pixel tiles flash randomly at high speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue |
| モチーフ (`content.subjects`) | pixel_tiles |
| 模様 (`texture.patterns`) | pixel_grid |
| 光の変化 (`light.behaviors`) | flashing |
| 光の変化速度 (`light.speed`) | fast |
| 発光の時間パターン (`light.timing`) | random |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 11.mp4

> 青と緑、ワブリー黒いトンネルの中でカメラが奥に。Medium speed. 円形のネオンが点滅。

Blue and green scene inside a wobbly black tunnel with flashing circular neon. Camera moves forward at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue, green, black |
| 舞台・空間 (`content.setting`) | tunnel |
| モチーフ (`content.subjects`) | neon_rings |
| 表面色 (`color.surface`) | black |
| 表面の起伏 (`geometry.surface_relief`) | wobbly |
| 幾何形状 (`geometry.shapes`) | circle |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| 光の種類 (`light.types`) | neon |
| 光の変化 (`light.behaviors`) | flashing |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 12.mp4

> 丸いトンネルの中で円形のネオンが奥から手前までランダムに点滅。青と紫。カメラはゆっくり奥へ。点滅は非常に速い。

Blue and purple circular tunnel with circular neon flashing very rapidly and randomly along its depth. Camera advances slowly; the flashing is very fast despite the slow camera.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue, purple |
| 舞台・空間 (`content.setting`) | tunnel |
| トンネル断面 (`geometry.tunnel_section`) | circular |
| モチーフ (`content.subjects`) | neon_rings |
| 幾何形状 (`geometry.shapes`) | circle |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| 光の種類 (`light.types`) | neon |
| 光の変化 (`light.behaviors`) | flashing |
| 発光の時間パターン (`light.timing`) | random |
| 配置 (`composition.layout`) | along_depth |
| 光の変化速度 (`light.speed`) | fast |

補足：奥から手前までの点滅は位置範囲として保持。発光が連続移動する方向とは断定しない。 / ユーザーの追加説明で点滅が非常に速いと確認。light.speed=fast。カメラのslowとは独立。

### animation 13.mp4

> 2D、青とピンクとオレンジ。横長のタイルがゆっくり点灯してゆっくり消える。ランダムなオフセット。

Blue, pink and orange 2D horizontal tiles fade in and out slowly with random timing offsets.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue, pink, orange |
| 画面の次元 (`content.dimension`) | 2d |
| モチーフ (`content.subjects`) | tiles |
| 幾何形状 (`geometry.shapes`) | horizontal_rectangle |
| 光の変化 (`light.behaviors`) | fade_in, fade_out |
| 光の変化速度 (`light.speed`) | slow |
| 発光の時間パターン (`light.timing`) | random_offsets |
| 位相・タイミング関係 (`rhythm.phase_relation`) | random_offsets |
| 色温度の傾向 (`color.temperature`) | mixed |

派生属性：color.temperature

### animation 14.mp4

> 平面を斜め上から見下ろすサイバーカラフル。二重の平面の上に直線のネオンが光っている。

Colorful cyber-style double planes with glowing straight neon lines, viewed obliquely from above.

| 評価軸 | 値 |
| --- | --- |
| 色の構成 (`color.mode`) | multicolor |
| 表現・ジャンル (`content.style`) | cyber |
| モチーフ (`content.subjects`) | planes, neon_lines |
| 幾何形状 (`geometry.shapes`) | plane, line |
| 構造 (`geometry.topology`) | two_layers |
| 視点 (`camera.viewpoint`) | oblique_overhead |
| 光の種類 (`light.types`) | neon |
| 光の変化 (`light.behaviors`) | glowing |

### animation 15.mp4

> 青、ミディアムスピード、丸いトンネルが下へ下へ湾曲しており、カメラはどんどん奥へ下へ進んで沈んでいく。

Blue circular tunnel bends downward. Camera continuously advances forward and downward at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue |
| 舞台・空間 (`content.setting`) | tunnel |
| トンネル断面 (`geometry.tunnel_section`) | circular |
| カメラ移動方向 (`camera.translation`) | forward_into_scene, downward |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| カメラ経路 (`camera.path`) | descending_curve |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 16.mp4

> 2D、青とオレンジ、直線のネオンが時計回りに回転する。ネオンのパターンはチュビシェフ模様で切り替わっている。

Blue and orange 2D straight neon lines rotate clockwise and switch between patterns described as Chebyshev patterns.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue, orange |
| 画面の次元 (`content.dimension`) | 2d |
| モチーフ (`content.subjects`) | neon_lines |
| 幾何形状 (`geometry.shapes`) | line |
| 模様 (`texture.patterns`) | chebyshev_pattern |
| 光の種類 (`light.types`) | neon |
| 動きの種類 (`motion.types`) | rotation, pattern_switching |
| 動く対象 (`motion.targets`) | neon_lines |
| 物体の回転方向 (`motion.rotation_direction`) | clockwise |
| 色温度の傾向 (`color.temperature`) | mixed |

補足：チュビシェフをチェビシェフと正規化。生成アルゴリズムは未検証。

派生属性：color.temperature

### animation 17.mp4

> カメラは固定。中央に三角のワイヤーフレームでできた人間の顔がゆっくり動いている。ワイヤーフレームの間はシアンとマゼンタに光っている。

Fixed camera on a slowly moving central human face made of triangular wireframe, with cyan and magenta light between the wires.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | cyan, magenta |
| 発光色 (`color.emission`) | cyan, magenta |
| モチーフ (`content.subjects`) | human_face |
| 人体モチーフ (`content.human_form`) | true |
| 模様 (`texture.patterns`) | wireframe |
| 幾何形状 (`geometry.shapes`) | triangle |
| 配置 (`composition.layout`) | centered |
| カメラ固定 (`camera.fixed`) | true |
| 動きの種類 (`motion.types`) | unspecified_motion |
| 動く対象 (`motion.targets`) | human_face |
| 物体の速度 (`motion.subject_speed`) | slow |
| 光の変化 (`light.behaviors`) | glowing |

### animation 18.mp4

> カメラは固定、2D。画面を横に3分割、縦に7分割したタイルがゆっくり光り消える。光はオレンジ。

Fixed camera, 2D tile layout with three horizontal divisions and seven vertical divisions. Orange lights fade in and out slowly.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | orange |
| 発光色 (`color.emission`) | orange |
| 画面の次元 (`content.dimension`) | 2d |
| モチーフ (`content.subjects`) | tiles |
| 模様 (`texture.patterns`) | grid |
| グリッド寸法 (`composition.grid`) | 横に3分割・縦に7分割（原文） |
| カメラ固定 (`camera.fixed`) | true |
| 光の変化 (`light.behaviors`) | fade_in, fade_out |
| 光の変化速度 (`light.speed`) | slow |
| 色温度の傾向 (`color.temperature`) | warm |

派生属性：color.temperature

### animation 19.mp4

> カメラは固定。中央から伸びる線がうにょうにょ動いている。線はオレンジと黄色。線の太さは固定。

Fixed camera on orange and yellow lines wriggling outward from the center; line thickness stays constant.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | orange, yellow |
| モチーフ (`content.subjects`) | lines |
| 幾何形状 (`geometry.shapes`) | line |
| 配置 (`composition.layout`) | radial_from_center |
| カメラ固定 (`camera.fixed`) | true |
| 動きの種類 (`motion.types`) | deformation |
| 動く対象 (`motion.targets`) | lines |
| 形状変形 (`motion.deformation`) | wriggling |
| 模様 (`texture.patterns`) | constant_line_width |
| 色温度の傾向 (`color.temperature`) | warm |

派生属性：color.temperature

### animation 20.mp4

> 青、カメラは固定。画面の中央に直方体のワイヤーフレームが幾重にも異なったサイズとスケールで重なっており、それが拡大縮小する。オブジェクトは全てまとめてX軸Y軸でゆっくり回転している。回転は等速。オブジェクトは画面を埋めるほどのサイズ。

Fixed camera on blue nested cuboid wireframes filling the image. They expand and shrink, rotating together slowly at constant rate about X and Y.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue |
| モチーフ (`content.subjects`) | cuboid_wireframes |
| 幾何形状 (`geometry.shapes`) | cuboid |
| 模様 (`texture.patterns`) | wireframe |
| 構造 (`geometry.topology`) | nested, multiple_scales |
| 配置 (`composition.layout`) | centered |
| 画面の占有 (`composition.coverage`) | full_frame |
| カメラ固定 (`camera.fixed`) | true |
| 動きの種類 (`motion.types`) | rotation, scale_up, scale_down |
| 動く対象 (`motion.targets`) | cuboid_wireframes |
| 物体の回転軸 (`motion.rotation_axes`) | x, y |
| 物体の回転速度 (`motion.rotation_speed`) | slow |
| 物体回転の緩急 (`motion.rotation_profile`) | constant |
| 動きの同期関係 (`motion.synchrony`) | rigid_group |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 21.mp4

> 2D回転モノクロ。円形に並んだタイルが明滅している。

Monochrome 2D rotating visual with circularly arranged flashing tiles. Rotation direction and rotating subject are unspecified.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 色の構成 (`color.mode`) | grayscale |
| 画面の次元 (`content.dimension`) | 2d |
| モチーフ (`content.subjects`) | tiles |
| 配置 (`composition.layout`) | circular_array |
| 光の変化 (`light.behaviors`) | flashing |
| 動きの種類 (`motion.types`) | rotation |
| 色温度の傾向 (`color.temperature`) | neutral |

補足：「2D回転」はカメラと物体のどちらの回転か不明。方向も未記載。

派生属性：color.temperature

### animation 22.mp4

> 平面上に円形に並んだタイルがオレンジ色に明滅しているが、それをカメラは斜め上から撮影している。

Orange flashing tiles arranged in a circle on a plane, viewed obliquely from above.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | orange |
| 発光色 (`color.emission`) | orange |
| モチーフ (`content.subjects`) | tiles |
| 配置 (`composition.layout`) | circular_array |
| 幾何形状 (`geometry.shapes`) | plane |
| 視点 (`camera.viewpoint`) | oblique_overhead |
| 光の変化 (`light.behaviors`) | flashing |
| 色温度の傾向 (`color.temperature`) | warm |

派生属性：color.temperature

### animation 24.mp4

> 四角いトンネルのワイヤーフレームのトンネルの中をカメラが奥の方向へゆっくり動いている。ワイヤーフレームは中くらいの速度で青くランダムなタイミングで。点滅している。

Square wireframe tunnel. Camera advances slowly while blue wireframe lights flash randomly at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue |
| 発光色 (`color.emission`) | blue |
| 舞台・空間 (`content.setting`) | tunnel |
| トンネル断面 (`geometry.tunnel_section`) | square |
| 模様 (`texture.patterns`) | wireframe |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| 光の変化 (`light.behaviors`) | flashing |
| 光の変化速度 (`light.speed`) | medium |
| 発光の時間パターン (`light.timing`) | random |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 28.mp4

> オレンジと黒。溶岩の海の上にオレンジの丸いネオンのトンネルがあり、それをカメラは手前から奥へハイスピードで進んでいく。

Orange and black lava sea beneath a circular orange neon tunnel. Camera moves forward fast.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | orange, black |
| 発光色 (`color.emission`) | orange |
| 舞台・空間 (`content.setting`) | tunnel, lava_sea |
| モチーフ (`content.subjects`) | neon_rings |
| トンネル断面 (`geometry.tunnel_section`) | circular |
| 材質 (`material.types`) | lava |
| 光の種類 (`light.types`) | neon |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | fast |
| 色温度の傾向 (`color.temperature`) | warm |

派生属性：color.temperature

### animation 30.mp4

> 正三角形に並んだ緑と青の蛍光ランプがランダムに明滅するカメラ固定2D。

Fixed-camera 2D green and blue fluorescent lamps arranged as an equilateral triangle, flashing randomly.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | green, blue |
| 発光色 (`color.emission`) | green, blue |
| 画面の次元 (`content.dimension`) | 2d |
| モチーフ (`content.subjects`) | fluorescent_lamps |
| 配置 (`composition.layout`) | equilateral_triangle |
| カメラ固定 (`camera.fixed`) | true |
| 光の種類 (`light.types`) | fluorescent |
| 光の変化 (`light.behaviors`) | flashing |
| 発光の時間パターン (`light.timing`) | random |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 31.mp4

> 白黒の島模様の深淵のトンネルの中をカメラがゆっくり奥へ進む。

Black-and-white abyssal tunnel with a described "island pattern". Camera advances slowly.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 色の構成 (`color.mode`) | grayscale |
| 舞台・空間 (`content.setting`) | tunnel, abyss |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| 色温度の傾向 (`color.temperature`) | neutral |

補足：「島模様」は「縞模様」の可能性があるが未確定のため、ストライプのタグを付けない。

派生属性：color.temperature

### animation 32.mp4

> 青いネオンが縦に並んだ空間の中で、銀色の鏡面反射する人型がゆっくり回転している。

Silver mirror-reflective humanoid rotates slowly among vertically arranged blue neon lights.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue, silver |
| 表面色 (`color.surface`) | silver |
| 発光色 (`color.emission`) | blue |
| モチーフ (`content.subjects`) | humanoid, neon |
| 人体モチーフ (`content.human_form`) | true |
| 表面仕上げ (`material.finish`) | mirror |
| 配置 (`composition.layout`) | vertical_array |
| 光の種類 (`light.types`) | neon |
| 動きの種類 (`motion.types`) | rotation |
| 動く対象 (`motion.targets`) | humanoid |
| 物体の回転速度 (`motion.rotation_speed`) | slow |
| 光学表現 (`light.effects`) | reflection |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 33.mp4

> 四角い真っ黒なトンネルの中に、壁、床、天井にネオンがランダムに並んでおり、ランダムなタイミングでシアンとマゼンタに点滅する。それに加えて、たまにイエローもある。カメラはMedium speedで奥へ進む。

Pitch-black square tunnel with neon placed randomly on walls, floor and ceiling. Cyan and magenta flashes with occasional yellow. Camera advances at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, cyan, magenta, yellow |
| 背景・環境色 (`color.background`) | black |
| 発光色 (`color.emission`) | cyan, magenta, yellow |
| アクセント色 (`color.accent`) | yellow |
| 舞台・空間 (`content.setting`) | tunnel |
| トンネル断面 (`geometry.tunnel_section`) | square |
| 配置 (`composition.layout`) | walls_floor_ceiling |
| 反復配置 (`composition.repetition`) | random_placement |
| 光の種類 (`light.types`) | neon |
| 光の変化 (`light.behaviors`) | flashing |
| 発光の時間パターン (`light.timing`) | random |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| 色温度の傾向 (`color.temperature`) | mixed |

派生属性：color.temperature

### animation 35.mp4

> 青白く光る星がたくさんある中を、カメラが奥の方へハイスピードで移動。星はスピードのせいで伸びて見える。

Many blue-white glowing stars appear stretched by rapid forward camera travel.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue_white |
| 発光色 (`color.emission`) | blue_white |
| モチーフ (`content.subjects`) | stars |
| 密度・個数感 (`composition.density`) | many |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | fast |
| 光の変化 (`light.behaviors`) | glowing |
| 光学表現 (`light.effects`) | motion_streaks |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 37.mp4

> ランダムな四角い模様で反射率が変わっているメタリックな床の上に、ピンクの丸いネオンが等間隔に並んだトンネルがあり、その中をカメラが奥の方へ進んでいく。mediumスピード。

Evenly spaced pink neon rings form a tunnel over a metallic floor with randomly patterned square reflectivity. Camera advances at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | pink |
| 発光色 (`color.emission`) | pink |
| 舞台・空間 (`content.setting`) | tunnel |
| モチーフ (`content.subjects`) | neon_rings, floor |
| 幾何形状 (`geometry.shapes`) | circle |
| 材質 (`material.types`) | metal |
| 模様 (`texture.patterns`) | random_square_reflectivity |
| 反復配置 (`composition.repetition`) | regular_spacing |
| 光の種類 (`light.types`) | neon |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| 光学表現 (`light.effects`) | reflection |

### animation 38.mp4

> 横に長い四角いトンネルの中をカメラが奥へゆっくり進む。トンネルの床と天井には3本ずつ青いネオンがずっと並んでおり、トンネルの壁面と天井にはトンネルを横切る方向にピンクのネオンが等間隔に並んでいる。

Wide rectangular tunnel with three continuous blue neon lines each on floor and ceiling and regularly spaced pink transverse neon. Slow forward camera travel.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue, pink |
| 発光色 (`color.emission`) | blue, pink |
| 舞台・空間 (`content.setting`) | tunnel |
| トンネル断面 (`geometry.tunnel_section`) | wide_rectangle |
| 幾何形状 (`geometry.shapes`) | line |
| 配置 (`composition.layout`) | floor_and_ceiling, walls |
| 反復配置 (`composition.repetition`) | regular_spacing |
| 光の種類 (`light.types`) | neon |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |

### animation 39.mp4

> 波打った床と天井からなる空間で、左右に謎のピラミッド状のサイファイ風オブジェクトが等間隔に並んでいる。カメラはその中を奥の方へハイスピードで移動する。ピラミッドはオレンジで、かつ空間の中に三角形の青色のネオンが等間隔にあり、光っている。

Wavy floor-and-ceiling passage with evenly spaced orange sci-fi pyramids on both sides and blue triangular neon. Camera moves forward fast.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | orange, blue |
| 表面色 (`color.surface`) | orange |
| 発光色 (`color.emission`) | blue |
| 舞台・空間 (`content.setting`) | floor_ceiling_space |
| モチーフ (`content.subjects`) | pyramids, neon |
| 表現・ジャンル (`content.style`) | sci_fi |
| 幾何形状 (`geometry.shapes`) | pyramid, triangle |
| 表面の起伏 (`geometry.surface_relief`) | wavy |
| 配置 (`composition.layout`) | both_sides, floor_and_ceiling |
| 反復配置 (`composition.repetition`) | regular_spacing |
| 光の種類 (`light.types`) | neon |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | fast |
| 色温度の傾向 (`color.temperature`) | mixed |

派生属性：color.temperature

### animation 41.mp4

> 宇宙船の廊下をカメラが奥の方へ、中くらいのスピードで進んでいる、カメラは時計回りに回転している。床には細い青いネオンが光っており、壁面にはオレンジのネオンが等間隔に取り付けられている。天井には白い蛍光灯が並んでおり、点滅している。

Spaceship corridor with thin blue floor neon, regularly spaced orange wall neon and flashing white ceiling fluorescents. Camera advances at medium speed and rotates clockwise.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue, orange, white |
| 発光色 (`color.emission`) | blue, orange, white |
| 舞台・空間 (`content.setting`) | spaceship_corridor |
| モチーフ (`content.subjects`) | neon, fluorescent_lamps |
| 表現・ジャンル (`content.style`) | sci_fi |
| 配置 (`composition.layout`) | walls_floor_ceiling |
| 反復配置 (`composition.repetition`) | regular_spacing |
| 光の種類 (`light.types`) | neon, fluorescent |
| 光の変化 (`light.behaviors`) | flashing |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| カメラ回転方向 (`camera.rotation_direction`) | clockwise |
| カメラ回転様式 (`camera.rotation_mode`) | unspecified |
| 色温度の傾向 (`color.temperature`) | mixed |

派生属性：color.temperature

### animation 44.mp4

> パーリンノイズでできた地形。黒色で少しマットな質感の泥のような山の上をカメラがゆっくり奥へ移動する。地面はピンクと紫のライトがあたっている

Black, slightly matte mud-like mountains described as Perlin-noise terrain, illuminated pink and purple. Camera travels slowly forward above the ground.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, pink, purple |
| 表面色 (`color.surface`) | black |
| 照明色 (`color.illumination`) | pink, purple |
| 舞台・空間 (`content.setting`) | terrain |
| モチーフ (`content.subjects`) | mountains |
| 材質 (`material.types`) | mud_like |
| 表面仕上げ (`material.finish`) | slightly_matte |
| ノイズ種別 (`texture.noise_family`) | perlin |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| カメラ経路 (`camera.path`) | above_ground |

### animation 77.mp4

> ピンクと紫でできたパーリンノイズの模様の半透明の膜を突き破るように、カメラは手前から奥へ進んでいく.mediumスピード。

Pink and purple translucent membrane with a Perlin-noise pattern. Camera advances through it at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | pink, purple |
| モチーフ (`content.subjects`) | membrane |
| 物体の透過性 (`material.transparency`) | translucent |
| ノイズ種別 (`texture.noise_family`) | perlin |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| カメラ経路 (`camera.path`) | through_membranes |

### animation 78.mp4

> 前方向へ転がる太陽の下半分だけを写している。輪郭だけが黄色く光って見えて、それ以外の部分は緩やかにオレンジ色に照らされている。太陽の中央は黒い。

Only the lower half of a forward-rolling sun is shown: yellow glowing outline, soft orange illumination and a black center.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | yellow, orange, black |
| 発光色 (`color.emission`) | yellow |
| 照明色 (`color.illumination`) | orange |
| モチーフ (`content.subjects`) | sun |
| 見切れ・切り取り (`composition.crop`) | lower_half |
| 動きの種類 (`motion.types`) | rolling |
| 動く対象 (`motion.targets`) | sun |
| 光の変化 (`light.behaviors`) | outline_glow |
| 配置 (`composition.layout`) | black_center |
| 色温度の傾向 (`color.temperature`) | warm |

補足：「前方向」の座標系が不明なため画面内方向・奥行き方向は未設定。緩やかな照明は移動速度に変換しない。

派生属性：color.temperature

### animation 79.mp4

> 2D。画面上に十数本ほどの白い線が波打っている。波打っており、光っている。光り方はそれぞれバラバラにゆっくり明滅しており、光が強くなると光の上下に虹色のアーティファクトが見える。

2D white wavy glowing lines, roughly a dozen, pulse slowly and independently. Rainbow artifacts appear above and below brighter parts.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white, rainbow |
| 主色 (`color.dominant`) | white |
| アクセント色 (`color.accent`) | rainbow |
| 発光色 (`color.emission`) | white |
| 画面の次元 (`content.dimension`) | 2d |
| モチーフ (`content.subjects`) | lines |
| 幾何形状 (`geometry.shapes`) | line |
| 動きの種類 (`motion.types`) | deformation |
| 動く対象 (`motion.targets`) | lines |
| 形状変形 (`motion.deformation`) | wavy |
| 光の変化 (`light.behaviors`) | pulsing |
| 光の変化速度 (`light.speed`) | slow |
| 発光の時間パターン (`light.timing`) | independent |
| 位相・タイミング関係 (`rhythm.phase_relation`) | independent |
| 光学表現 (`light.effects`) | rainbow_artifacts |

### animation 80.mp4

> 上振りなトンネルの中をカメラが手前から奥へ、中くらいのスピードで進む。カメラは時計回りに回転している。壁面はピンクとシアンの色のライトで光っている。

Tunnel lit pink and cyan. Camera advances at medium speed and rotates clockwise; the transcript leaves the tunnel surface description unclear.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | pink, cyan |
| 照明色 (`color.illumination`) | pink, cyan |
| 舞台・空間 (`content.setting`) | tunnel |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| カメラ回転方向 (`camera.rotation_direction`) | clockwise |
| カメラ回転様式 (`camera.rotation_mode`) | unspecified |

補足：「上振りなトンネル」は意味未確定。wobbly等には置換しない。

### animation 83.mp4

> 長方形のサイファイ風のオブジェクトが、トンネルの壁面と天井というか塔にランダムに配置され、その中をカメラが手前から奥へ気持ち早めに動いている。サイファイ風のオブジェクトは回転している。回転の方向はバラバラだが、回転のスピードは一緒。オブジェクト上には青い小さなライトが配置されている。

Rectangular sci-fi objects are scattered on a tunnel structure and rotate in different directions at matching speeds. Small blue lights decorate them. Camera advances somewhat fast.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue |
| 発光色 (`color.emission`) | blue |
| 舞台・空間 (`content.setting`) | tunnel |
| モチーフ (`content.subjects`) | sci_fi_objects |
| 表現・ジャンル (`content.style`) | sci_fi |
| 幾何形状 (`geometry.shapes`) | rectangle |
| 反復配置 (`composition.repetition`) | random_placement |
| 被写体の大きさ (`composition.scale`) | small_lights |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium_fast |
| 動きの種類 (`motion.types`) | rotation |
| 動く対象 (`motion.targets`) | sci_fi_objects |
| 物体の回転方向 (`motion.rotation_direction`) | mixed |
| 動きの同期関係 (`motion.synchrony`) | same_speed_different_directions |
| 色温度の傾向 (`color.temperature`) | cool |

補足：「気持ち早め」はmedium_fastの定性的ラベル。壁面・天井・塔の位置関係は未確定。

派生属性：color.temperature

### animation 92.mp4

> 急峻な谷の底をゆっくりとカメラが奥へ移動する。谷の壁面は赤く光っており、奥に見える空は黄色く光っている。

Deep steep canyon with glowing red walls and yellow sky in the distance. Camera moves slowly forward along the bottom.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | red, yellow |
| 発光色 (`color.emission`) | red, yellow |
| 背景・環境色 (`color.background`) | yellow |
| 舞台・空間 (`content.setting`) | canyon |
| モチーフ (`content.subjects`) | canyon_walls, sky |
| 表面の起伏 (`geometry.surface_relief`) | steep |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| カメラ経路 (`camera.path`) | canyon_bottom |
| 光の変化 (`light.behaviors`) | glowing |
| 色温度の傾向 (`color.temperature`) | warm |

派生属性：color.temperature

### animation 93.mp4

> アブストラクトなラインアートが黄緑に光っている。ラインアートはシンプルなカレードスコープエフェクトがかかっており、上下左右対称になっている。

Yellow-green glowing abstract line art with a simple kaleidoscope effect and both horizontal and vertical mirror symmetry.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | yellow_green |
| 発光色 (`color.emission`) | yellow_green |
| モチーフ (`content.subjects`) | line_art |
| 表現・ジャンル (`content.style`) | abstract |
| 幾何形状 (`geometry.shapes`) | line |
| 模様 (`texture.patterns`) | kaleidoscope |
| 対称性 (`composition.symmetry`) | left_right, top_bottom |
| 光の変化 (`light.behaviors`) | glowing |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### animation 94.mp4

> アブストラクトなラインアートがピンクに光っている。ラインアートはシンプルなカレードスコープエフェクトがかかっており、上下左右対称になっている。

Pink glowing abstract line art with a simple kaleidoscope effect and both horizontal and vertical mirror symmetry.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | pink |
| 発光色 (`color.emission`) | pink |
| モチーフ (`content.subjects`) | line_art |
| 表現・ジャンル (`content.style`) | abstract |
| 幾何形状 (`geometry.shapes`) | line |
| 模様 (`texture.patterns`) | kaleidoscope |
| 対称性 (`composition.symmetry`) | left_right, top_bottom |
| 光の変化 (`light.behaviors`) | glowing |

### animation 95.mp4

> XY軸等速で回転するスフィアの表面上に青白い光が浮いている。光の輪郭はおそらく球面上のシンプレックスノイズで作られた模様。球体はいくつか同心円状に並んでいるが、球面自体は見えず、光だけが見えている。カメラは固定。

Fixed camera on nested concentric spherical light patterns. Blue-white lights rotate at constant rate around X and Y; the sphere surfaces themselves are invisible. Simplex noise is only a user hypothesis.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue_white |
| 発光色 (`color.emission`) | blue_white |
| モチーフ (`content.subjects`) | spherical_light_patterns |
| 幾何形状 (`geometry.shapes`) | sphere |
| 構造 (`geometry.topology`) | concentric_shells |
| 配置 (`composition.layout`) | centered |
| カメラ固定 (`camera.fixed`) | true |
| 動きの種類 (`motion.types`) | rotation |
| 動く対象 (`motion.targets`) | spherical_light_patterns |
| 物体の回転軸 (`motion.rotation_axes`) | x, y |
| 物体回転の緩急 (`motion.rotation_profile`) | constant |
| 光の変化 (`light.behaviors`) | glowing |
| 色温度の傾向 (`color.temperature`) | cool |

補足：シンプレックスノイズは原文でも「おそらく」。確定属性には入れない。球面が見えないことは透明素材やalphaの根拠にしない。

派生属性：color.temperature

### animation 98.mp4

> RGB3色の横方向の直線がランダムに明滅する。直線はチェビシェフ模様で区切られた区間にランダムに配置されている。

Red, green and blue horizontal straight lines flash randomly within randomly placed Chebyshev-pattern regions.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | red, green, blue |
| 色の構成 (`color.mode`) | rgb |
| モチーフ (`content.subjects`) | lines |
| 幾何形状 (`geometry.shapes`) | line |
| 模様 (`texture.patterns`) | chebyshev_pattern |
| 配置 (`composition.layout`) | horizontal_lines |
| 反復配置 (`composition.repetition`) | random_placement |
| 光の変化 (`light.behaviors`) | flashing |
| 発光の時間パターン (`light.timing`) | random |
| 色温度の傾向 (`color.temperature`) | mixed |

派生属性：color.temperature

## Inferno

### Inferno_damnation_01.mov

> アブストラクトな赤い炎の模様。炎は円形に画面の外から画面の中央へ向かってゆっくり狭まっていく。

Abstract red flame pattern slowly contracts in a circle from the image edges toward the center.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | red |
| モチーフ (`content.subjects`) | flames |
| 表現・ジャンル (`content.style`) | abstract |
| 動きの種類 (`motion.types`) | contraction |
| 動く対象 (`motion.targets`) | flame_pattern |
| 画面上の移動方向 (`motion.screen_direction`) | edges_to_center |
| 物体の速度 (`motion.subject_speed`) | slow |
| 幾何形状 (`geometry.shapes`) | circle |
| 色温度の傾向 (`color.temperature`) | warm |

派生属性：color.temperature

### Inferno_damnation_02a.mov

> 赤と黒の溶岩の表面。溶岩の隙間から燃える赤い光はランダムにゆっくり明滅している。

Red and black lava surface with red light in the cracks flashing slowly and randomly.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | red, black |
| 発光色 (`color.emission`) | red |
| モチーフ (`content.subjects`) | lava |
| 材質 (`material.types`) | lava |
| 模様 (`texture.patterns`) | cracks |
| 光の変化 (`light.behaviors`) | flashing |
| 光の変化速度 (`light.speed`) | slow |
| 発光の時間パターン (`light.timing`) | random |
| 色温度の傾向 (`color.temperature`) | warm |

派生属性：color.temperature

### Inferno_demise_01.mov

> 青い溶岩の表面。溶岩はゆっくり明滅している。黒い部分は少ない。

Blue lava surface slowly pulses; only a small proportion is black.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue, black |
| 主色 (`color.dominant`) | blue |
| アクセント色 (`color.accent`) | black |
| モチーフ (`content.subjects`) | lava |
| 材質 (`material.types`) | lava |
| 光の変化 (`light.behaviors`) | pulsing |
| 光の変化速度 (`light.speed`) | slow |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### Inferno_demise_02.mov

> 青い溶岩のような光が画面下から上へゆっくり移動している。模様は左右対称になっている。

Blue lava-like light rises slowly from bottom to top in a left-right symmetric pattern.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue |
| 発光色 (`color.emission`) | blue |
| モチーフ (`content.subjects`) | lava_like_light |
| 対称性 (`composition.symmetry`) | left_right |
| 光の変化 (`light.behaviors`) | traveling_light |
| 光の画面内移動 (`light.screen_direction`) | bottom_to_top |
| 光の変化速度 (`light.speed`) | slow |
| 色温度の傾向 (`color.temperature`) | cool |

派生属性：color.temperature

### Inferno_oblivion_02.mov

> 黒い池の表面に白い小さなライトがいくつも浮かんでおり、それがゆっくりバラバラに明滅している。光は斜めにストリークを出している。

Small white lights float on a black pond surface and flash slowly at independent times, producing diagonal light streaks.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 表面色 (`color.surface`) | black |
| 発光色 (`color.emission`) | white |
| 舞台・空間 (`content.setting`) | pond |
| モチーフ (`content.subjects`) | small_lights |
| 材質 (`material.types`) | water |
| 被写体の大きさ (`composition.scale`) | small |
| 光の変化 (`light.behaviors`) | flashing |
| 光の変化速度 (`light.speed`) | slow |
| 発光の時間パターン (`light.timing`) | independent |
| 位相・タイミング関係 (`rhythm.phase_relation`) | independent |
| 光学表現 (`light.effects`) | diagonal_streaks |
| 色温度の傾向 (`color.temperature`) | neutral |

派生属性：color.temperature

### Inferno_oblivion_03.mov

> 真っ黒な波打つ水面の上で、白い光が画面中央から画面外に向かってゆっくりと円形に広がっていく。

White light slowly expands radially from center to edges over a pitch-black, wavy water surface.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 表面色 (`color.surface`) | black |
| 発光色 (`color.emission`) | white |
| モチーフ (`content.subjects`) | water_surface |
| 材質 (`material.types`) | water |
| 表面の起伏 (`geometry.surface_relief`) | wavy |
| 光の変化 (`light.behaviors`) | traveling_light |
| 光の画面内移動 (`light.screen_direction`) | center_to_edges |
| 光の変化速度 (`light.speed`) | slow |
| 幾何形状 (`geometry.shapes`) | circle |
| 色温度の傾向 (`color.temperature`) | neutral |

派生属性：color.temperature

## loopable-smoke

### smoke_h264_2.mov

> 白黒の画面で煙が下から上へ広がり、また消えていく。

Black-and-white smoke spreads upward from bottom to top and dissipates.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 色の構成 (`color.mode`) | grayscale |
| モチーフ (`content.subjects`) | smoke |
| 材質 (`material.types`) | smoke |
| 動きの種類 (`motion.types`) | expansion, dissipation |
| 動く対象 (`motion.targets`) | smoke |
| 画面上の移動方向 (`motion.screen_direction`) | bottom_to_top |
| 色温度の傾向 (`color.temperature`) | neutral |

派生属性：color.temperature

### smoke_h264_3.mov

> 少しだけ赤い空間の中で、青白い煙が竜巻を起こしている。竜巻は画面の80%くらいを占める太さ。竜巻は煙を斜め上に吸い上げている。

Blue-white smoke forms a thick tornado in a slightly red environment, pulling smoke diagonally upward. The user describes its thickness as about 80% of the image.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue_white, red |
| 表面色 (`color.surface`) | blue_white |
| 背景・環境色 (`color.background`) | red |
| モチーフ (`content.subjects`) | smoke, tornado |
| 材質 (`material.types`) | smoke |
| 画面の占有 (`composition.coverage`) | large |
| 動きの種類 (`motion.types`) | swirling, suction |
| 動く対象 (`motion.targets`) | smoke |
| 画面上の移動方向 (`motion.screen_direction`) | diagonally_upward |
| 色温度の傾向 (`color.temperature`) | mixed |

補足：80%は原文の太さの目安。画面幅・面積の厳密な比率は不明。竜巻の回転方向は未記載。

派生属性：color.temperature

### smoke_h264_6.mov

> ピンクの煙が画面を埋め尽くし、下から上へ吹き上げている。

Pink smoke fills the frame and blows upward from bottom to top.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | pink |
| モチーフ (`content.subjects`) | smoke |
| 材質 (`material.types`) | smoke |
| 画面の占有 (`composition.coverage`) | full_frame |
| 動きの種類 (`motion.types`) | eruption |
| 動く対象 (`motion.targets`) | smoke |
| 画面上の移動方向 (`motion.screen_direction`) | bottom_to_top |

## mantissa

パック全体の注記：全体的に情報量多め。

### mantissa.xyz_loop_001.mp4

> 薄いシアンの空間の中で六角柱状のトンネルの壁面にオレンジと銅の色の板が並んでいる。画面の奥から小さな線状の光が少しずつ流れてくる。カメラは奥へ10くらいのスピードで移動する。また、カメラは半時計回りに回転している。Sci-fi

Sci-fi hexagonal tunnel in a pale cyan environment with orange and copper-colored plates. Small linear lights flow from depth toward the viewer. Camera advances at medium speed and rotates counterclockwise.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | pale_cyan, orange, copper |
| 背景・環境色 (`color.background`) | pale_cyan |
| 表面色 (`color.surface`) | orange, copper |
| 舞台・空間 (`content.setting`) | tunnel |
| トンネル断面 (`geometry.tunnel_section`) | hexagonal |
| モチーフ (`content.subjects`) | plates, linear_lights |
| 表現・ジャンル (`content.style`) | sci_fi |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| カメラ回転方向 (`camera.rotation_direction`) | counterclockwise |
| カメラ回転様式 (`camera.rotation_mode`) | unspecified |
| 光の変化 (`light.behaviors`) | traveling_light |
| 光の奥行き移動 (`light.depth_direction`) | back_to_front |
| 色温度の傾向 (`color.temperature`) | mixed |

補足：「10くらいのスピード」はユーザー訂正により「中くらいのスピード」=medium。原文は保存。半時計回り→反時計回り。

派生属性：color.temperature

### mantissa.xyz_loop_002.mp4

> 六角形のサーファイ風トンネルの中をカメラはゆっくり奥へ移動する。トンネルの中にはオレンジの円形のネオンが6つ並んでおり、トンネルとは独立して回転している。また、緑色の光が手前から奥へ飛んでいく。

Sci-fi hexagonal tunnel with six orange circular neon elements rotating independently of the tunnel. Green light travels away from the viewer. Camera moves forward slowly.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | orange, green |
| 発光色 (`color.emission`) | orange, green |
| 舞台・空間 (`content.setting`) | tunnel |
| トンネル断面 (`geometry.tunnel_section`) | hexagonal |
| モチーフ (`content.subjects`) | neon_rings |
| 表現・ジャンル (`content.style`) | sci_fi |
| 幾何形状 (`geometry.shapes`) | circle |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| 動きの種類 (`motion.types`) | rotation |
| 動く対象 (`motion.targets`) | neon_rings |
| 動きの同期関係 (`motion.synchrony`) | independent_of_tunnel |
| 光の種類 (`light.types`) | neon |
| 光の変化 (`light.behaviors`) | traveling_light |
| 光の奥行き移動 (`light.depth_direction`) | front_to_back |
| 色温度の傾向 (`color.temperature`) | mixed |

補足：サーファイ風を文脈からsci_fiと解釈。ネオンの回転方向と速度は未記載。

派生属性：color.temperature

### mantissa.xyz_loop_003.mp4

> レトロなゲームのワイヤーフレームの3D空間の街の中に道路があり、その上を見下ろす形でカメラは奥の方へゆっくり進んでいく。

Retro-game 3D wireframe city and road, viewed from above while the camera advances slowly.

| 評価軸 | 値 |
| --- | --- |
| モチーフ (`content.subjects`) | city, road |
| 舞台・空間 (`content.setting`) | city |
| 表現・ジャンル (`content.style`) | retro_game |
| 画面の次元 (`content.dimension`) | 3d |
| 模様 (`texture.patterns`) | wireframe |
| 視点 (`camera.viewpoint`) | overhead |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |

### mantissa.xyz_loop_004.mp4

> リアルな黒い岩のトンネルの中をカメラが宙くらいのスピードで奥へ進んでいく。トンネルには正方形の白いライトのフレームがトンネルの外周部に等間隔に並べられている。

Realistic black rock tunnel with regularly spaced square white light frames around its perimeter. Camera advances at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 表面色 (`color.surface`) | black |
| 発光色 (`color.emission`) | white |
| 舞台・空間 (`content.setting`) | tunnel |
| モチーフ (`content.subjects`) | light_frames |
| 幾何形状 (`geometry.shapes`) | square |
| 材質 (`material.types`) | rock |
| 写実性 (`content.realism`) | realistic |
| 反復配置 (`composition.repetition`) | regular_spacing |
| 配置 (`composition.layout`) | tunnel_perimeter |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| 色温度の傾向 (`color.temperature`) | neutral |

補足：宙くらいのスピードを文脈から中くらい=mediumと解釈。

派生属性：color.temperature

### mantissa.xyz_loop_013.mp4

> 黒いリアルな岩のトンネルの中に、カメラが奥へ中くらいのスピードで進んでいく。トンネルの壁面には円形の白いライトが、トンネルの壁面をぐるっと囲むようにZ方向に等間隔になるように取り付けられている。ネオンは白く光っており、ネオンの一部にオレンジとシアンの光もついている。

Realistic black rock tunnel encircled by white neon rings at regular depth intervals, with orange and cyan details. Camera advances at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white, orange, cyan |
| 表面色 (`color.surface`) | black |
| 発光色 (`color.emission`) | white, orange, cyan |
| アクセント色 (`color.accent`) | orange, cyan |
| 舞台・空間 (`content.setting`) | tunnel |
| モチーフ (`content.subjects`) | neon_rings |
| 幾何形状 (`geometry.shapes`) | circle |
| 材質 (`material.types`) | rock |
| 写実性 (`content.realism`) | realistic |
| 反復配置 (`composition.repetition`) | regular_spacing |
| 配置 (`composition.layout`) | tunnel_perimeter, along_depth |
| 光の種類 (`light.types`) | neon |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| 色温度の傾向 (`color.temperature`) | mixed |

派生属性：color.temperature

### mantissa.xyz_loop_014.mp4

> サイファイ風のワイヤーフレームの街の高速道路の上をカメラがゆっくり移動する。カメラは左斜め上から見下ろす形で映しており、街は右下に流れていく。

Sci-fi wireframe city highway viewed obliquely from upper left. Camera moves slowly; the city drifts toward the lower right on screen. Camera travel direction is unspecified.

| 評価軸 | 値 |
| --- | --- |
| モチーフ (`content.subjects`) | city, highway |
| 舞台・空間 (`content.setting`) | city |
| 表現・ジャンル (`content.style`) | sci_fi |
| 模様 (`texture.patterns`) | wireframe |
| 視点 (`camera.viewpoint`) | oblique_overhead, from_upper_left |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| 動きの種類 (`motion.types`) | screen_drift |
| 動く対象 (`motion.targets`) | city_image |
| 画面上の移動方向 (`motion.screen_direction`) | toward_lower_right |

### mantissa.xyz_loop_016.mp4

> 銅の色の有機的な形の巨大な細長いオブジェクトが画面中央でウニョウニョうごめいている。オブジェクトは長い柱になっており、カメラの中央でゆっくり時計回りに回転している。

Huge elongated copper-colored organic column wriggles at image center and rotates slowly clockwise.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | copper |
| 表面色 (`color.surface`) | copper |
| モチーフ (`content.subjects`) | organic_column |
| 有機的な形 (`content.organic`) | true |
| 幾何形状 (`geometry.shapes`) | elongated_column |
| 配置 (`composition.layout`) | centered |
| 被写体の大きさ (`composition.scale`) | huge |
| 動きの種類 (`motion.types`) | deformation, rotation |
| 動く対象 (`motion.targets`) | organic_column |
| 形状変形 (`motion.deformation`) | wriggling |
| 物体の回転方向 (`motion.rotation_direction`) | clockwise |
| 物体の回転速度 (`motion.rotation_speed`) | slow |
| 色温度の傾向 (`color.temperature`) | warm |

派生属性：color.temperature

### mantissa.xyz_loop_049.mp4

> 黒いメタリックな触手が画面の中央から伸びており、触手の塊がX軸Y軸でゆっくり回転している。触手の一部はオレンジ色のネオン状の模様がアニメーションしている。また、触手の周りに薄いピンクのオーラもある。

Black metallic tentacles extend from the center. The cluster rotates slowly around X and Y, with animated orange neon-like patterns and a pale pink aura.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, orange, pale_pink |
| 表面色 (`color.surface`) | black |
| 発光色 (`color.emission`) | orange, pale_pink |
| モチーフ (`content.subjects`) | tentacles |
| 材質 (`material.types`) | metal |
| 配置 (`composition.layout`) | radial_from_center |
| 動きの種類 (`motion.types`) | rotation |
| 動く対象 (`motion.targets`) | tentacle_cluster |
| 物体の回転軸 (`motion.rotation_axes`) | x, y |
| 物体の回転速度 (`motion.rotation_speed`) | slow |
| 光の種類 (`light.types`) | neon_like, aura |
| 光の変化 (`light.behaviors`) | animated_pattern |

### mantissa.xyz_loop_052.mp4

> 黒いケーブルが奥へと、手前から奥へと大量に伸びている中を、カメラが高速に奥の方向へ移動する。カメラはゆっくり半時計回りに動いている。また、ケーブルを束ねるように、トンネルをぐるっと取り囲むように、円形の白いネオンが等間隔に取り付けられている

Dense black cables stretch into depth, encircled by regularly spaced white neon rings. Camera moves forward fast while rotating slowly counterclockwise.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 表面色 (`color.surface`) | black |
| 発光色 (`color.emission`) | white |
| モチーフ (`content.subjects`) | cables, neon_rings |
| 舞台・空間 (`content.setting`) | tunnel |
| 幾何形状 (`geometry.shapes`) | circle |
| 密度・個数感 (`composition.density`) | dense |
| 配置 (`composition.layout`) | along_depth |
| 反復配置 (`composition.repetition`) | regular_spacing |
| 光の種類 (`light.types`) | neon |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | fast |
| カメラ回転方向 (`camera.rotation_direction`) | counterclockwise |
| カメラ回転様式 (`camera.rotation_mode`) | unspecified |
| カメラ回転速度 (`camera.rotation_speed`) | slow |
| 色温度の傾向 (`color.temperature`) | neutral |

補足：半時計回り→反時計回り。並進fastと回転slowを別々に保持。

派生属性：color.temperature

### mantissa.xyz_loop_088.mp4

> 黒いメタリックな液体が画面下から上の方向へ吹き上げており、液体の表面には緑、ピンク、青の光が反射している。

Black metallic liquid erupts upward, reflecting green, pink and blue light on its surface.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, green, pink, blue |
| 表面色 (`color.surface`) | black |
| 照明色 (`color.illumination`) | green, pink, blue |
| モチーフ (`content.subjects`) | liquid |
| 材質 (`material.types`) | metallic_liquid |
| 動きの種類 (`motion.types`) | eruption |
| 動く対象 (`motion.targets`) | liquid |
| 画面上の移動方向 (`motion.screen_direction`) | bottom_to_top |
| 光学表現 (`light.effects`) | reflection |
| 光の変化 (`light.behaviors`) | reflection |

### mantissa.xyz_loop_091.mp4

> 白い直方体のパーティクルが多数、大量にうごめいている。パーティクルにはオレンジと水色の光がそれぞれ別方向からぼんやりと弱く当たっている。

Many white cuboid particles wriggle, softly and weakly illuminated from different directions by orange and light-blue light.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white, orange, light_blue |
| 表面色 (`color.surface`) | white |
| 照明色 (`color.illumination`) | orange, light_blue |
| モチーフ (`content.subjects`) | particles |
| 幾何形状 (`geometry.shapes`) | cuboid |
| 密度・個数感 (`composition.density`) | many |
| 動きの種類 (`motion.types`) | wriggling |
| 動く対象 (`motion.targets`) | particles |
| 発光強度 (`light.intensity`) | low |
| 光学表現 (`light.effects`) | soft_illumination |
| 色温度の傾向 (`color.temperature`) | mixed |

派生属性：color.temperature

### mantissa.xyz_loop_093.mp4

> 画面中央の丸いシアン色のネオンから金属の三角形のパーティクルが大量に放出されており、放射状に動いている。パーティクルはピンクの光を受けて光っている。

A central circular cyan neon source emits many metallic triangle particles radially outward. Particles reflect pink illumination.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | cyan, pink |
| 発光色 (`color.emission`) | cyan |
| 照明色 (`color.illumination`) | pink |
| モチーフ (`content.subjects`) | particles, neon_ring |
| 幾何形状 (`geometry.shapes`) | triangle, circle |
| 材質 (`material.types`) | metal |
| 配置 (`composition.layout`) | centered, radial_from_center |
| 密度・個数感 (`composition.density`) | many |
| 動きの種類 (`motion.types`) | emission, radial_expansion |
| 動く対象 (`motion.targets`) | particles |
| 画面上の移動方向 (`motion.screen_direction`) | center_to_edges |
| 光の種類 (`light.types`) | neon |
| 光学表現 (`light.effects`) | reflection |

### mantissa.xyz_loop_100.mp4

> 白い月面の上をカメラが斜めから見下ろす形で、手前から奥へゆっくり動いている。

White lunar surface seen obliquely from above as the camera travels forward slowly.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white |
| 表面色 (`color.surface`) | white |
| 舞台・空間 (`content.setting`) | lunar_surface |
| モチーフ (`content.subjects`) | terrain |
| 視点 (`camera.viewpoint`) | oblique_overhead |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| 色温度の傾向 (`color.temperature`) | neutral |

派生属性：color.temperature

## Opti

### Opti1.mov

> 遠景の広いトンネルの中をカメラは奥へ高速に移動する。トンネルの壁面にはライトがあり、奥から手前から奥の方へ高速にライトの光のアニメーションがある。カメラはまた半時計回りにも回転している。

Wide tunnel viewed into the distance. Camera advances fast and rotates counterclockwise. Wall lights animate fast, but their depth direction is ambiguous in the transcript.

| 評価軸 | 値 |
| --- | --- |
| 舞台・空間 (`content.setting`) | tunnel |
| モチーフ (`content.subjects`) | wall_lights |
| 視点 (`camera.viewpoint`) | distant_view |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | fast |
| カメラ回転方向 (`camera.rotation_direction`) | counterclockwise |
| カメラ回転様式 (`camera.rotation_mode`) | unspecified |
| 光の変化 (`light.behaviors`) | traveling_light |
| 光の変化速度 (`light.speed`) | fast |

補足：半時計回り→反時計回り。「奥から手前から奥」の光の進行方向は未確定。色は未記載。

### Opti2.mov

> 横長の超空砲体のトンネルの中をカメラがでゆっくり奥へ移動する。壁面は音楽のビートに合わせて白い光がアニメーションしている。

Wide tunnel with beat-pattern white wall lights. Camera moves slowly forward; exact tunnel geometry is unclear in the transcript.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white |
| 発光色 (`color.emission`) | white |
| 舞台・空間 (`content.setting`) | tunnel |
| モチーフ (`content.subjects`) | wall_lights |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| 光の変化 (`light.behaviors`) | animated_pattern |
| 発光の時間パターン (`light.timing`) | beat_pattern |
| ビート状の光アニメーション (`rhythm.beat_pattern`) | true |
| 色温度の傾向 (`color.temperature`) | neutral |

補足：「超空砲体」は誤認識と思われるが形状を断定しない。ビート表現はライブ同期を意味しない。

派生属性：color.temperature

### Opti3.mov

> 金属と白い光でできた直方体からなる工場で、直方体からできたドアが開いて、その中をカメラがゆっくり奥へ移動する。

Factory made of metal cuboids and white light. Cuboid doors open as the camera advances slowly through them.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white |
| 発光色 (`color.emission`) | white |
| 舞台・空間 (`content.setting`) | factory |
| モチーフ (`content.subjects`) | doors, cuboids |
| 幾何形状 (`geometry.shapes`) | cuboid |
| 材質 (`material.types`) | metal |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| カメラ経路 (`camera.path`) | through_doors |
| 動きの種類 (`motion.types`) | opening |
| 動く対象 (`motion.targets`) | doors |
| 色温度の傾向 (`color.temperature`) | neutral |

派生属性：color.temperature

### Opti5.mov

> 三角形の謎の物体が時計回りに回転しており、その上をカメラは斜め上から見下ろしている。三角形の金属でできた物体には四角いドットマトリクスがあり、ドットは白色にビートに合わせた光のアニメーションが行われている。

Metal triangular object rotates clockwise, viewed obliquely from above. Square dot-matrix lights on its surface animate white to a beat pattern.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white |
| 発光色 (`color.emission`) | white |
| モチーフ (`content.subjects`) | triangular_object |
| 幾何形状 (`geometry.shapes`) | triangle, square |
| 材質 (`material.types`) | metal |
| 模様 (`texture.patterns`) | dot_matrix |
| 視点 (`camera.viewpoint`) | oblique_overhead |
| 動きの種類 (`motion.types`) | rotation |
| 動く対象 (`motion.targets`) | triangular_object |
| 物体の回転方向 (`motion.rotation_direction`) | clockwise |
| 光の変化 (`light.behaviors`) | animated_pattern |
| 発光の時間パターン (`light.timing`) | beat_pattern |
| ビート状の光アニメーション (`rhythm.beat_pattern`) | true |
| 色温度の傾向 (`color.temperature`) | neutral |

派生属性：color.temperature

### Opti6.mov

> 金属の無機質な四角いトンネルの中をカメラが中くらいのスピードで奥へ移動する。トンネルには鉄格子が何重にもはめられており、鉄格子の上には白い光のドットアニメーションが下から上へ移動している。

Inorganic metal square tunnel with multiple grilles. White light dots travel upward on the grilles while the camera advances at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white |
| 発光色 (`color.emission`) | white |
| 舞台・空間 (`content.setting`) | tunnel |
| モチーフ (`content.subjects`) | grilles, light_dots |
| トンネル断面 (`geometry.tunnel_section`) | square |
| 材質 (`material.types`) | metal |
| 構造 (`geometry.topology`) | multiple_layers |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | medium |
| 光の変化 (`light.behaviors`) | traveling_light |
| 光の画面内移動 (`light.screen_direction`) | bottom_to_top |
| 色温度の傾向 (`color.temperature`) | neutral |

派生属性：color.temperature

### Opti7A.mov

> 暗い金属の部屋の中で、金属でできた四角い謎のオブジェが光っている。ランダムに光っている。カメラはそれをぐるっと回転するように、時計回りに回転しながら撮影している。

Dark metal room with a randomly glowing square metal object. Camera circles around the object clockwise.

| 評価軸 | 値 |
| --- | --- |
| 全体の明暗 (`color.brightness`) | dark |
| 舞台・空間 (`content.setting`) | room |
| モチーフ (`content.subjects`) | square_object |
| 幾何形状 (`geometry.shapes`) | square |
| 材質 (`material.types`) | metal |
| カメラ経路 (`camera.path`) | orbit_around_subject |
| カメラ回転様式 (`camera.rotation_mode`) | orbit |
| カメラ回転方向 (`camera.rotation_direction`) | clockwise |
| 光の変化 (`light.behaviors`) | flashing |
| 発光の時間パターン (`light.timing`) | random |

補足：周回orbitと解釈。画面のロール回転とは区別。光の色・カメラ速度は未記載。

### Opti8.mov

> 右に広がる鉄の網が天井と床になっており、その中をカメラはゆっくりと奥へ移動する。鉄の網は、の上を白い光のアニメーションが高速にビートに合わせて明滅している。

Iron mesh floor and ceiling extend laterally. Camera advances slowly while white light flashes rapidly in a beat pattern.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white |
| 発光色 (`color.emission`) | white |
| モチーフ (`content.subjects`) | mesh |
| 舞台・空間 (`content.setting`) | floor_ceiling_space |
| 材質 (`material.types`) | iron |
| 模様 (`texture.patterns`) | mesh |
| 配置 (`composition.layout`) | floor_and_ceiling |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| 光の変化 (`light.behaviors`) | flashing |
| 光の変化速度 (`light.speed`) | fast |
| 発光の時間パターン (`light.timing`) | beat_pattern |
| ビート状の光アニメーション (`rhythm.beat_pattern`) | true |
| 色温度の傾向 (`color.temperature`) | neutral |

派生属性：color.temperature

### Opti9_alpha.mov

> 透明のチューブでできたウニの周りをカメラがゆっくり回転している。チューブの中にはビートに合わせてウニの中央から外周部へ光が移動している。

Urchin-like form made of transparent tubes. Camera slowly orbits it while light moves through the tubes from the center outward in a beat pattern.

| 評価軸 | 値 |
| --- | --- |
| モチーフ (`content.subjects`) | urchin_like_form, tubes |
| 幾何形状 (`geometry.shapes`) | tube |
| 物体の透過性 (`material.transparency`) | transparent |
| カメラ経路 (`camera.path`) | orbit_around_subject |
| カメラ回転様式 (`camera.rotation_mode`) | orbit |
| カメラ回転方向 (`camera.rotation_direction`) | unspecified |
| カメラ回転速度 (`camera.rotation_speed`) | slow |
| 光の変化 (`light.behaviors`) | traveling_light |
| 光の画面内移動 (`light.screen_direction`) | center_to_edges |
| 発光の時間パターン (`light.timing`) | beat_pattern |
| ビート状の光アニメーション (`rhythm.beat_pattern`) | true |

補足：透明なのはチューブの材質。ファイル名_alphaから動画alphaの有無を断定しない。光の色は未記載。

### Opti12.mov

> 金属の無機質な建物の中で、扉を開けたらまた扉があり、扉を開けたらまた扉がある無限ループ。扉の上には白い光が扉の中央から扉の外周に向かって四角い形で広がっていく。

Inorganic metal building with an endless sequence of doors opening onto more doors. White light expands as square patterns from each door center toward its edges.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white |
| 発光色 (`color.emission`) | white |
| 舞台・空間 (`content.setting`) | building |
| モチーフ (`content.subjects`) | doors |
| 材質 (`material.types`) | metal |
| 幾何形状 (`geometry.shapes`) | square |
| 動きの種類 (`motion.types`) | opening |
| 動く対象 (`motion.targets`) | doors |
| 光の変化 (`light.behaviors`) | traveling_light |
| 光の画面内移動 (`light.screen_direction`) | center_to_edges |
| 反復する出来事 (`rhythm.repeating_event`) | successive_door_opening |
| ループの記述 (`rhythm.loop_description`) | endless_door_sequence |
| 色温度の傾向 (`color.temperature`) | neutral |

補足：扉の連続からカメラ前進を推定せず未設定。無限ループは内容の記述でシームレス性の検証ではない。

派生属性：color.temperature

### Opti14.mov

> 金属の無機質な部屋の中に、巨大な円形の鏡面の球体があり、球体にビートに合わせて光る白い光が反射している。

Huge mirror-finished sphere inside an inorganic metal room reflects white light flashing to a beat pattern.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white |
| 発光色 (`color.emission`) | white |
| 舞台・空間 (`content.setting`) | room |
| モチーフ (`content.subjects`) | sphere |
| 幾何形状 (`geometry.shapes`) | sphere |
| 材質 (`material.types`) | metal |
| 表面仕上げ (`material.finish`) | mirror |
| 被写体の大きさ (`composition.scale`) | huge |
| 光の変化 (`light.behaviors`) | reflection, flashing |
| 光学表現 (`light.effects`) | reflection |
| 発光の時間パターン (`light.timing`) | beat_pattern |
| ビート状の光アニメーション (`rhythm.beat_pattern`) | true |
| 色温度の傾向 (`color.temperature`) | neutral |

派生属性：color.temperature

### OptiA-blackcubes.mov

> 回転する小さな白いライトが画面上に2D状にグリッド状に配置されており、ランダムなタイミングで光っている。

Small rotating white lights arranged as a 2D grid flash at random times.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white |
| 発光色 (`color.emission`) | white |
| 画面の次元 (`content.dimension`) | 2d |
| モチーフ (`content.subjects`) | small_lights |
| 配置 (`composition.layout`) | grid |
| 模様 (`texture.patterns`) | grid |
| 被写体の大きさ (`composition.scale`) | small |
| 動きの種類 (`motion.types`) | rotation |
| 動く対象 (`motion.targets`) | small_lights |
| 光の変化 (`light.behaviors`) | flashing |
| 発光の時間パターン (`light.timing`) | random |
| 色温度の傾向 (`color.temperature`) | neutral |

派生属性：color.temperature

### OptiD-Perspectivecubes.mov

> 金属のキューブでできた斜面があり、それをアイソメトリック視点で撮影している。キューブのカメラから見えている3側面は、それぞれ別々にビートに合わせて点滅している。光は白。

Isometric view of a slope made of metal cubes. Three visible faces flash white independently in a beat pattern.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white |
| 発光色 (`color.emission`) | white |
| モチーフ (`content.subjects`) | cubes, slope |
| 幾何形状 (`geometry.shapes`) | cube |
| 材質 (`material.types`) | metal |
| 視点 (`camera.viewpoint`) | isometric |
| 光の変化 (`light.behaviors`) | flashing |
| 発光の時間パターン (`light.timing`) | beat_pattern, independent |
| 位相・タイミング関係 (`rhythm.phase_relation`) | independent_faces |
| ビート状の光アニメーション (`rhythm.beat_pattern`) | true |
| 色温度の傾向 (`color.temperature`) | neutral |

派生属性：color.temperature

### OptiE-Triangles_alpha.mov

> 鉄の三角形でできた謎の知恵の輪のようなオブジェクトが、Y軸に対して時計回りに回転している。三角形の表面には、謎の白い光の模様がうごめいている。

Iron triangular puzzle-like object rotates clockwise around Y. White luminous surface patterns wriggle.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | white |
| 発光色 (`color.emission`) | white |
| モチーフ (`content.subjects`) | puzzle_like_object |
| 幾何形状 (`geometry.shapes`) | triangle |
| 材質 (`material.types`) | iron |
| 動きの種類 (`motion.types`) | rotation |
| 動く対象 (`motion.targets`) | puzzle_like_object |
| 物体の回転方向 (`motion.rotation_direction`) | clockwise |
| 物体の回転軸 (`motion.rotation_axes`) | y |
| 光の変化 (`light.behaviors`) | animated_pattern |
| 色温度の傾向 (`color.temperature`) | neutral |

補足：Y軸に対する時計回りはユーザーの表現。視点と軸の正方向は未検証。alphaチャンネルは未確認。

派生属性：color.temperature

## SELDO

### BlackCuboid_easing.mp4

> 黒いキューブでできた街を左斜め上から見下ろしている。街は画面奥、つまり左上に向かって移動している。移動には強めのイージングがかかっており、動画開始時は早く、動画中央ではほとんど動かない。

Black cube city viewed obliquely from upper left. The city image moves toward upper left, described as deeper into the scene. Strong easing: fast at the start, nearly stationary at the middle.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black |
| 表面色 (`color.surface`) | black |
| 舞台・空間 (`content.setting`) | city |
| モチーフ (`content.subjects`) | cubes |
| 幾何形状 (`geometry.shapes`) | cube |
| 視点 (`camera.viewpoint`) | oblique_overhead, from_upper_left |
| 動きの種類 (`motion.types`) | screen_drift |
| 動く対象 (`motion.targets`) | city_image |
| 画面上の移動方向 (`motion.screen_direction`) | toward_upper_left |
| 物体の奥行き移動 (`motion.depth_direction`) | front_to_back |
| 物体移動の緩急 (`motion.speed_profile`) | fast_at_start, nearly_still_at_middle |
| イージング (`rhythm.easing`) | strong_easing |
| 色温度の傾向 (`color.temperature`) | neutral |

補足：街の画面内移動を記録。カメラの実移動方向は未確定。動画後半の速度経過は未記載。

派生属性：color.temperature

### Tile_Dark.mp4

> 規則的に並んだ黒いタイルが、高さはそれぞれバラバラに並んでいる。そのタイルが半時計回りに回転するのを、カメラは斜め上から映している。タイルの境目には白いグリッド状のネオンが並び、その後手にはシアン色の小さいキューブが配置されてて、光っている。

Regularly arranged black tiles at varying heights rotate counterclockwise, viewed obliquely from above. White grid neon marks tile borders, with small glowing cyan cubes nearby.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white, cyan |
| 表面色 (`color.surface`) | black |
| 発光色 (`color.emission`) | white, cyan |
| モチーフ (`content.subjects`) | tiles, cubes |
| 幾何形状 (`geometry.shapes`) | cube |
| 表面の起伏 (`geometry.surface_relief`) | varied_heights |
| 反復配置 (`composition.repetition`) | regular_placement |
| 模様 (`texture.patterns`) | grid |
| 視点 (`camera.viewpoint`) | oblique_overhead |
| 動きの種類 (`motion.types`) | rotation |
| 動く対象 (`motion.targets`) | tiles |
| 物体の回転方向 (`motion.rotation_direction`) | counterclockwise |
| 光の種類 (`light.types`) | neon |
| 光の変化 (`light.behaviors`) | glowing |
| 被写体の大きさ (`composition.scale`) | small_cubes |
| 色温度の傾向 (`color.temperature`) | cool |

補足：半時計回り→反時計回り。「その後手」の位置関係は未確定のため保持しない。

派生属性：color.temperature

## tatsuyam

### aqua_00.mp4

> 濃紺の水の中に泡が浮いている。実写、ペンギンが途中で泳いで去っていく。

Live-action bubbles floating in deep navy water. A penguin swims through and leaves partway through the clip.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 背景・環境色 (`color.background`) | navy |
| 舞台・空間 (`content.setting`) | underwater |
| モチーフ (`content.subjects`) | bubbles, penguin |
| 動きの種類 (`motion.types`) | floating, swimming |
| 動く対象 (`motion.targets`) | bubbles, penguin |

### aqua_10.mp4

> 小さなタコクラゲが画面右から左へ泳いでいくのをカメラが思いかけている。濃紺の水の中,実写。

Live-action small spotted jellyfish swims from screen right to left in deep navy water; the camera follows it.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 背景・環境色 (`color.background`) | navy |
| 舞台・空間 (`content.setting`) | underwater |
| モチーフ (`content.subjects`) | spotted_jellyfish |
| 被写体の大きさ (`composition.scale`) | small |
| カメラ経路 (`camera.path`) | tracking_subject |
| 動きの種類 (`motion.types`) | swimming |
| 動く対象 (`motion.targets`) | jellyfish |
| 画面上の移動方向 (`motion.screen_direction`) | right_to_left |

補足：「思いかけている」は文脈上「追いかけている」と解釈。被写体の左右移動をカメラの並進方向としては設定しない。

### aqua_11.mp4

> 黒い水の中を白、黄色、青のクラゲがゆっくり上へ上昇している。カメラはそれを追いかけている。実写。

Live-action white, yellow and blue jellyfish rise slowly through black water while the camera follows them.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 色パレット (`color.palette`) | black, white, yellow, blue |
| 背景・環境色 (`color.background`) | black |
| 表面色 (`color.surface`) | white, yellow, blue |
| 舞台・空間 (`content.setting`) | underwater |
| モチーフ (`content.subjects`) | jellyfish |
| カメラ経路 (`camera.path`) | tracking_subject |
| 動きの種類 (`motion.types`) | swimming, rising |
| 動く対象 (`motion.targets`) | jellyfish |
| 画面上の移動方向 (`motion.screen_direction`) | up |
| 物体の速度 (`motion.subject_speed`) | slow |

### aqua_14_.mp4

> 黒い水の中、クラゲの群れがゆっくり漂っている。

A group of jellyfish drifts slowly in black water.

| 評価軸 | 値 |
| --- | --- |
| 背景・環境色 (`color.background`) | black |
| 舞台・空間 (`content.setting`) | underwater |
| モチーフ (`content.subjects`) | jellyfish |
| 動きの種類 (`motion.types`) | drifting |
| 動く対象 (`motion.targets`) | jellyfish |
| 物体の速度 (`motion.subject_speed`) | slow |

補足：実写とは明記されていないため、他のaqua素材から実写タグを継承しない。

### aqua_16.mp4

> 黒い水の中、クラゲの群れがゆっくり漂っている。

A group of jellyfish drifts slowly in black water.

| 評価軸 | 値 |
| --- | --- |
| 背景・環境色 (`color.background`) | black |
| 舞台・空間 (`content.setting`) | underwater |
| モチーフ (`content.subjects`) | jellyfish |
| 動きの種類 (`motion.types`) | drifting |
| 動く対象 (`motion.targets`) | jellyfish |
| 物体の速度 (`motion.subject_speed`) | slow |

補足：実写とは明記されていないため、他のaqua素材から実写タグを継承しない。

### aqua_18.mp4

> 黒い水の中、クリオネ2匹がゆっくり泳いでいる。実写。

Live-action two sea angels (Clione) swim slowly in black water.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 背景・環境色 (`color.background`) | black |
| 舞台・空間 (`content.setting`) | underwater |
| モチーフ (`content.subjects`) | sea_angels, clione |
| 密度・個数感 (`composition.density`) | sparse |
| 動きの種類 (`motion.types`) | swimming |
| 動く対象 (`motion.targets`) | sea_angels |
| 物体の速度 (`motion.subject_speed`) | slow |

### aqua_22.mp4

> 濃紺な水の中をペンギンが時たま泳いでいる。実写。

Live-action penguins occasionally swim through navy water.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 背景・環境色 (`color.background`) | navy |
| 舞台・空間 (`content.setting`) | underwater |
| モチーフ (`content.subjects`) | penguins |
| 動きの種類 (`motion.types`) | swimming |
| 動く対象 (`motion.targets`) | penguins |
| 反復する出来事 (`rhythm.repeating_event`) | penguins_swim_past_intermittently |

補足：時たまは登場頻度。泳ぐ速度とは区別し、速度は未記載。

### aqua_23.mp4

> 水族館の大水槽の中、紺色の水の中、光が射している箇所に、小さなカラフルな魚たちが泳いでいる。実写。

Live-action small colorful fish swim in a lit part of a large aquarium tank filled with navy water.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 背景・環境色 (`color.background`) | navy |
| 表面色 (`color.surface`) | multicolor |
| 舞台・空間 (`content.setting`) | aquarium, large_water_tank |
| モチーフ (`content.subjects`) | small_fish |
| 被写体の大きさ (`composition.scale`) | small |
| 動きの種類 (`motion.types`) | swimming |
| 動く対象 (`motion.targets`) | fish |
| 光の変化 (`light.behaviors`) | localized_illumination |

### cross.mp4

> 真っ黒な背景に白い直線がやってきて、クロスを構成し、回転したり、明滅したりして消えていく。カメラはどんどん空間の奥にゆっくり進む。

On black, white straight lines arrive, assemble into crosses, rotate, flash and disappear. The camera advances slowly.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 色の構成 (`color.mode`) | grayscale |
| 背景・環境色 (`color.background`) | black |
| 表面色 (`color.surface`) | white |
| モチーフ (`content.subjects`) | lines, crosses |
| 幾何形状 (`geometry.shapes`) | line, cross |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| 動きの種類 (`motion.types`) | assembling, rotation, appearing, disappearing |
| 動く対象 (`motion.targets`) | lines, crosses |
| 光の変化 (`light.behaviors`) | flashing |

補足：カメラ速度だけがslow。図形の回転・点滅速度は未記載。

### CrossParticle.mp4

> 真っ黒な背景に白い直線がやってきて、クロスを構成し、回転したり、明滅したりして消えていく。画面中央から点対称。カメラはどんどん空間の奥にゆっくり進みつつ、反時計回りに回転

White lines on black form crosses, rotate, flash and disappear with point symmetry around the image center. The camera advances slowly and rotates counterclockwise.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 色の構成 (`color.mode`) | grayscale |
| 背景・環境色 (`color.background`) | black |
| 表面色 (`color.surface`) | white |
| モチーフ (`content.subjects`) | lines, crosses |
| 幾何形状 (`geometry.shapes`) | line, cross |
| カメラ移動方向 (`camera.translation`) | forward_into_scene |
| カメラ移動速度 (`camera.translation_speed`) | slow |
| 動きの種類 (`motion.types`) | assembling, rotation, appearing, disappearing |
| 動く対象 (`motion.targets`) | lines, crosses |
| 光の変化 (`light.behaviors`) | flashing |
| 対称性 (`composition.symmetry`) | point_symmetry |
| カメラ回転方向 (`camera.rotation_direction`) | counterclockwise |
| カメラ回転様式 (`camera.rotation_mode`) | unspecified |

補足：カメラ並進はslow。カメラ回転・図形・点滅の速度は未記載。

### cycle_d_01.mp4

> モノクロ。hex tileがめくれるアニメーションが、、画面中央から円状に広がっていく。周縁部にレンズ歪みと色収差

Predominantly monochrome hexagonal tiles flip in a circular wave spreading outward from the center. Lens distortion and chromatic aberration appear near the edges.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 色の構成 (`color.mode`) | grayscale |
| モチーフ (`content.subjects`) | hexagonal_tiles |
| 幾何形状 (`geometry.shapes`) | hexagon |
| 模様 (`texture.patterns`) | hexagonal_tiling |
| 動きの種類 (`motion.types`) | flipping |
| 動く対象 (`motion.targets`) | tiles |
| 画面上の移動方向 (`motion.screen_direction`) | center_to_edges |
| 光学表現 (`light.effects`) | lens_distortion, chromatic_aberration |
| 位相・タイミング関係 (`rhythm.phase_relation`) | radial_propagation |

補足：基調はモノクロだが、周縁に色収差あり。完全な無彩色のみとは断定しない。

### DiamondTile.mp4

> モノクロ。45度斜めのグリッド上にあるひし形タイル内で、正方形が拡大して明滅するアニメーション。タイルごとに明るさやタイミングがバラバラ。 アニメーションは中くらいのスピード

Monochrome diamond tiles form a grid rotated 45 degrees. Squares within each tile expand and flash, with differing brightness and timing per tile. The animation runs at medium speed.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 色の構成 (`color.mode`) | grayscale |
| モチーフ (`content.subjects`) | diamond_tiles, squares |
| 幾何形状 (`geometry.shapes`) | diamond, square |
| 配置 (`composition.layout`) | diagonal_grid |
| 模様 (`texture.patterns`) | grid |
| 動きの種類 (`motion.types`) | scale_up |
| 動く対象 (`motion.targets`) | squares |
| 物体の速度 (`motion.subject_speed`) | medium |
| 光の変化 (`light.behaviors`) | flashing |
| 光の変化速度 (`light.speed`) | medium |
| 発光の時間パターン (`light.timing`) | independent_per_tile |
| 位相・タイミング関係 (`rhythm.phase_relation`) | independent_per_tile |

補足：mediumは拡大・明滅を含むアニメーション全体の記述。カメラ速度ではない。

### Flickering_01.mp4

> モノクロ。シンプルなラインの基本図形（円、四角）がビートに合わせて出現、拡大、縮小、回転を組み合わせて出現し、すぐに消滅。

Monochrome simple outline circles and squares appear in beat-like bursts, combining expansion, contraction and rotation, then quickly disappear.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 色の構成 (`color.mode`) | grayscale |
| モチーフ (`content.subjects`) | outline_shapes |
| 幾何形状 (`geometry.shapes`) | circle, square |
| 表現・ジャンル (`content.style`) | minimal_geometric |
| 動きの種類 (`motion.types`) | appearing, scale_up, scale_down, rotation, disappearing |
| 動く対象 (`motion.targets`) | outline_shapes |
| ビート状の光アニメーション (`rhythm.beat_pattern`) | true |
| 反復する出来事 (`rhythm.repeating_event`) | brief_appearance_and_disappearance |

補足：すぐ消滅は表示時間の短さ。回転やカメラの速度、BPMは未記載。

### fracture_03.mp4

> モノクロ。ひし形の内/外に白い破片が集まってfill, 散らばって消滅を交互に繰り返す。

Monochrome white fragments repeatedly gather and fill inside/outside a diamond shape, then scatter and disappear.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 色の構成 (`color.mode`) | grayscale |
| 表面色 (`color.surface`) | white |
| モチーフ (`content.subjects`) | fragments |
| 幾何形状 (`geometry.shapes`) | diamond |
| 配置 (`composition.layout`) | inside_and_outside_diamond |
| 動きの種類 (`motion.types`) | gathering, scattering, disappearing |
| 動く対象 (`motion.targets`) | fragments |
| 反復する出来事 (`rhythm.repeating_event`) | gather_fill_scatter_disappear |

### Metal_graphic_04.mp4

> モノクロ。金属のリングが沢山絡まってできたオブジェクトがゆっくり回転している。

A monochrome object made of many intertwined metal rings rotates slowly.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white |
| 色の構成 (`color.mode`) | grayscale |
| モチーフ (`content.subjects`) | intertwined_rings |
| 幾何形状 (`geometry.shapes`) | ring |
| 構造 (`geometry.topology`) | intertwined |
| 材質 (`material.types`) | metal |
| 密度・個数感 (`composition.density`) | many |
| 動きの種類 (`motion.types`) | rotation |
| 動く対象 (`motion.targets`) | ring_assembly |
| 物体の回転速度 (`motion.rotation_speed`) | slow |

### night_b_540p.mp4

> 夜の街、実写。完全に焦点が外れた夜の街で、信号の光や車の光が丸い化けとなって移動する。画面の大部分は動いていない。

Live-action night city entirely out of focus. Traffic signal and car lights form moving circular bokeh; most of the image stays still.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 舞台・空間 (`content.setting`) | city_at_night |
| モチーフ (`content.subjects`) | traffic_lights, car_lights, bokeh |
| 幾何形状 (`geometry.shapes`) | circle |
| 光学表現 (`light.effects`) | defocus, bokeh |
| 光の変化 (`light.behaviors`) | moving |
| 動く対象 (`motion.targets`) | bokeh_lights |

補足：「丸い化け」は前後の焦点説明から丸いボケと解釈。画面の大部分が静止という記述からカメラ固定とは断定しない。

### noise_pattern_3.mp4

> 横長の細長い矩形グリッドで、perlin noiseで青と白がゆっくり明滅する。

A grid of narrow horizontally elongated rectangles slowly flickers between blue and white following Perlin noise.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue, white |
| モチーフ (`content.subjects`) | rectangular_tiles |
| 幾何形状 (`geometry.shapes`) | rectangle |
| 模様 (`texture.patterns`) | grid |
| ノイズ種別 (`texture.noise_family`) | perlin |
| 配置 (`composition.layout`) | horizontal_narrow_rectangular_grid |
| 光の変化 (`light.behaviors`) | flashing |
| 光の変化速度 (`light.speed`) | slow |

### oil_macro_a_540p.mp4

> 黒い水面に無数の油の膜が円形となって漂っている。油の膜は白い光を反射している。実写

Live-action countless circular oil films float on black water and reflect white light.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 背景・環境色 (`color.background`) | black |
| 照明色 (`color.illumination`) | white |
| 舞台・空間 (`content.setting`) | water_surface |
| モチーフ (`content.subjects`) | oil_films |
| 幾何形状 (`geometry.shapes`) | circle |
| 材質 (`material.types`) | oil, water |
| 密度・個数感 (`composition.density`) | many |
| 動きの種類 (`motion.types`) | floating |
| 動く対象 (`motion.targets`) | oil_films |
| 光の変化 (`light.behaviors`) | reflection |

### oil_macro_b_540p.mp4

> 水面に泡が漂って、泡は青い光を反射して、ほのかにグローしている。泡はゆっくり右から左へ移動している。実写

Live-action bubbles on water reflect blue light with a faint glow and drift slowly from right to left.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 照明色 (`color.illumination`) | blue |
| 舞台・空間 (`content.setting`) | water_surface |
| モチーフ (`content.subjects`) | bubbles |
| 材質 (`material.types`) | water |
| 動きの種類 (`motion.types`) | drifting |
| 動く対象 (`motion.targets`) | bubbles |
| 物体の速度 (`motion.subject_speed`) | slow |
| 画面上の移動方向 (`motion.screen_direction`) | right_to_left |
| 光の変化 (`light.behaviors`) | reflection, glowing |
| 光学表現 (`light.effects`) | glow |
| 発光強度 (`light.intensity`) | low |

### oil_macro_c_540p.mp4

> 赤い背景の前面に水面の油の泡がゆらゆら漂って、右から左へ移動している。ゆっくり。実写

Live-action oil bubbles on water drift and sway slowly from right to left in front of a red background.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 背景・環境色 (`color.background`) | red |
| 舞台・空間 (`content.setting`) | water_surface |
| モチーフ (`content.subjects`) | oil_bubbles |
| 材質 (`material.types`) | oil, water |
| 動きの種類 (`motion.types`) | drifting, swaying |
| 動く対象 (`motion.targets`) | oil_bubbles |
| 物体の速度 (`motion.subject_speed`) | slow |
| 画面上の移動方向 (`motion.screen_direction`) | right_to_left |

### oil_macro_f1_540p.mp4

> 虹色（赤強め）の背景の全面に、油の泡がゆっくり漂っている。泡が背景を虹色に反射している。実写

Live-action oil bubbles drift slowly in front of a rainbow-colored, red-heavy background. The bubbles reflect the rainbow colors of the background.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 色パレット (`color.palette`) | rainbow, red |
| 背景・環境色 (`color.background`) | rainbow |
| 主色 (`color.dominant`) | red |
| 色の構成 (`color.mode`) | multicolor |
| 照明色 (`color.illumination`) | rainbow |
| モチーフ (`content.subjects`) | oil_bubbles |
| 材質 (`material.types`) | oil |
| 動きの種類 (`motion.types`) | drifting |
| 動く対象 (`motion.targets`) | oil_bubbles |
| 物体の速度 (`motion.subject_speed`) | slow |
| 光の変化 (`light.behaviors`) | reflection |

### oil_macro_f2_540p.mp4

> 虹色（赤強め）の背景の全面に、油の泡がゆっくり漂っている。泡が背景を虹色に反射している。実写

Live-action oil bubbles drift slowly in front of a rainbow-colored, red-heavy background. The bubbles reflect the rainbow colors of the background.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 色パレット (`color.palette`) | rainbow, red |
| 背景・環境色 (`color.background`) | rainbow |
| 主色 (`color.dominant`) | red |
| 色の構成 (`color.mode`) | multicolor |
| 照明色 (`color.illumination`) | rainbow |
| モチーフ (`content.subjects`) | oil_bubbles |
| 材質 (`material.types`) | oil |
| 動きの種類 (`motion.types`) | drifting |
| 動く対象 (`motion.targets`) | oil_bubbles |
| 物体の速度 (`motion.subject_speed`) | slow |
| 光の変化 (`light.behaviors`) | reflection |

### polyFX.mp4

> カメラに向う方向にキューブがゆっくり転がってくる。キューブ本体は完全に透明で視えないが、表面にはstroke付きタイルがあり、タイルがパターンアニメーションをしている（中くらいのスピード）

A cube rolls slowly toward the camera. Its body is completely transparent and invisible, while outlined surface tiles display a pattern animation at medium speed.

| 評価軸 | 値 |
| --- | --- |
| モチーフ (`content.subjects`) | cube, outlined_tiles |
| 幾何形状 (`geometry.shapes`) | cube, tile |
| 物体の透過性 (`material.transparency`) | transparent |
| 模様 (`texture.patterns`) | outlined_tiles, animated_patterns |
| 動きの種類 (`motion.types`) | rolling, approaching, surface_pattern_animation |
| 動く対象 (`motion.targets`) | cube |
| 物体の奥行き移動 (`motion.depth_direction`) | toward_camera |
| 物体の速度 (`motion.subject_speed`) | slow |

補足：slowはキューブの転がる移動、mediumは表面パターンのアニメーション。後者を点滅速度やキューブ速度に置換しない。動画alphaは未確認。

### RepeShape.mp4

> 円状に小さな2Dマイクロアニメーションが並んで配置され、ビートに合わせて出現・消滅している。薄い黄色+シアン。

Small 2D micro-animations in pale yellow and cyan are arranged in a circle, appearing and disappearing to a beat-like pattern.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | pale_yellow, cyan |
| 画面の次元 (`content.dimension`) | 2d |
| モチーフ (`content.subjects`) | micro_animations |
| 配置 (`composition.layout`) | circular_array |
| 被写体の大きさ (`composition.scale`) | small |
| 動きの種類 (`motion.types`) | appearing, disappearing |
| ビート状の光アニメーション (`rhythm.beat_pattern`) | true |
| 反復する出来事 (`rhythm.repeating_event`) | appearance_and_disappearance |

### shape_repeater_skew_01.mp4

> 画面中央から円、四角、円形に配置されたひし形が拡大しつつ出現し、消滅していく。 円形に並んだ図形は、換気扇のような模様をなしている。

Circles, squares and circularly arranged diamonds appear from the center while expanding, then disappear. The circular arrangement resembles a ventilation fan.

| 評価軸 | 値 |
| --- | --- |
| モチーフ (`content.subjects`) | geometric_shapes |
| 幾何形状 (`geometry.shapes`) | circle, square, diamond |
| 配置 (`composition.layout`) | centered, circular_array, fan_like_pattern |
| 動きの種類 (`motion.types`) | appearing, scale_up, disappearing |
| 動く対象 (`motion.targets`) | geometric_shapes |

### snow_a.mp4

> 雪が振っている空を見上げるアングル。カメラ固定。すこしだけ青い。

Fixed camera looking upward into a snowy sky, with a slight blue tint.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | blue |
| 舞台・空間 (`content.setting`) | sky |
| モチーフ (`content.subjects`) | snow |
| 視点 (`camera.viewpoint`) | looking_up |
| カメラ固定 (`camera.fixed`) | true |
| 動きの種類 (`motion.types`) | falling |
| 動く対象 (`motion.targets`) | snow |

### StepTwist_01.mp4

> 白黒の直方体で構成された二重らせんがあり、その周囲を薄緑に光るネオンが斜めにまきついている。らせんは上から下に流れる構図。

A double helix made of black-and-white cuboids flows downward, with pale-green glowing neon wrapped diagonally around it.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white, pale_green |
| 表面色 (`color.surface`) | black, white |
| 発光色 (`color.emission`) | pale_green |
| モチーフ (`content.subjects`) | double_helix, cuboids, neon |
| 幾何形状 (`geometry.shapes`) | cuboid |
| 構造 (`geometry.topology`) | double_helix, diagonal_neon_wrap |
| 光の種類 (`light.types`) | neon |
| 光の変化 (`light.behaviors`) | glowing |
| 動きの種類 (`motion.types`) | translation |
| 動く対象 (`motion.targets`) | double_helix |
| 画面上の移動方向 (`motion.screen_direction`) | down |

### StepTwist_02.mp4

> 白黒の直方体で構成された二重らせんがあり、その周囲を薄緑に光るネオンが斜めにまきついている。二重らせんが75度ほど斜めになっており、右上から左下に流れる構図。

A black-and-white cuboid double helix, tilted about 75 degrees and wrapped diagonally in pale-green neon, flows from upper right to lower left.

| 評価軸 | 値 |
| --- | --- |
| 色パレット (`color.palette`) | black, white, pale_green |
| 表面色 (`color.surface`) | black, white |
| 発光色 (`color.emission`) | pale_green |
| モチーフ (`content.subjects`) | double_helix, cuboids, neon |
| 幾何形状 (`geometry.shapes`) | cuboid |
| 構造 (`geometry.topology`) | double_helix, diagonal_neon_wrap |
| 光の種類 (`light.types`) | neon |
| 光の変化 (`light.behaviors`) | glowing |
| 動きの種類 (`motion.types`) | translation |
| 動く対象 (`motion.targets`) | double_helix |
| 配置 (`composition.layout`) | tilted_about_75_degrees |
| 画面上の移動方向 (`motion.screen_direction`) | upper_right_to_lower_left |

補足：75度の基準軸は未記載。カメラ回転とは解釈しない。

### timelapse_night_01.mp4

> 青空のタイムラプス　実写 雲多め　雲は全部白い 流れは速い

Live-action timelapse of a blue daytime sky with many white clouds moving quickly.

| 評価軸 | 値 |
| --- | --- |
| 表現・ジャンル (`content.style`) | live_action |
| 写実性 (`content.realism`) | realistic |
| 色パレット (`color.palette`) | blue, white |
| 背景・環境色 (`color.background`) | blue |
| 表面色 (`color.surface`) | white |
| 舞台・空間 (`content.setting`) | sky |
| モチーフ (`content.subjects`) | clouds |
| 密度・個数感 (`composition.density`) | many |
| 動きの種類 (`motion.types`) | drifting |
| 動く対象 (`motion.targets`) | clouds |
| 物体の速度 (`motion.subject_speed`) | fast |

補足：ファイル名にnightがあるが、説明の青空・白い雲を優先。夜景とは分類しない。

### train_160327.mp4

> 電車の車窓から見える日本の都市の風景 暗め 風景は右から左へ流れる

A dark view of a Japanese city from a train window, with the scenery moving from screen right to left.

| 評価軸 | 値 |
| --- | --- |
| 全体の明暗 (`color.brightness`) | dark |
| 舞台・空間 (`content.setting`) | japanese_city, train_window_view |
| モチーフ (`content.subjects`) | urban_scenery |
| 視点 (`camera.viewpoint`) | through_train_window |
| 画面上の移動方向 (`motion.screen_direction`) | right_to_left |
| 動く対象 (`motion.targets`) | scenery |

補足：景色の画面上の移動方向を保持。電車の実際の進行方向、速度、実写の明示はない。

