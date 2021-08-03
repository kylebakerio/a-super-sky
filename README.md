# a-super-sky
<a href='https://ko-fi.com/kylev' target='_blank'><img height='35' style='border:0px;height:46px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' /><a/>

Fancy, lightweight, drop-in day-night sky component for A-Frame.
Utilizes [a-sun-sky](https://supermedium.com/superframe/components/sun-sky/) and [aframe-star-system](https://github.com/handeyeco/aframe-star-system-component) for A-Frame 1.1.0 compatible stars; Also borrowed heavily from [aframe-environment-component](https://github.com/supermedium/aframe-environment-component/commit/ab99293ee54826923212aca0dfc112d35b64d970)'s "starry" preset, a static scene, that I used for the 1.2.0 stars and as a starting point to extrapolate fog color to light color. Beyond those, this library adds fog to create a more appealing (imo) star fade in/out effect, stronger sunset effect, and also adds an entity that roughly tracks the sun/moon to allow shining a directional shadow-casting light source from the shader's "sun". Significant effort has been spent creating smooth transitions between all of these moving parts to create a coherent environment.

![moonlight-promo-19](https://user-images.githubusercontent.com/6391152/127781724-e853270a-4137-4f92-953d-2b18089b691e.png)
![sunset-room-shadow](https://user-images.githubusercontent.com/6391152/127769302-772c0c2d-246e-4c7e-87dd-f4a94e7b77b7.png)

# features!
- highly performant out of the box even with maximum settings enabled
- sunrise, daytime, and sunset feature beautiful rayleigh scattering colors in the sky
- `fog` creates feeling of creeping shadowy darkness after sunset, that then retreats as stars slowly fade into view and light the scene, without the cost of the equivalent shadows
- subtle 'colored' fog and lighting on the horizon adds a sense of depth and realism to the day and night's different stages
- moon also rises and sets, creating a blue rayleigh glow in the sky
- at dawn, stars gently fade out, sky stars to go from soft blues to pre-sawn reds, and then fog again comes in just to create a feeling of shadows retreating as sun rises
- **now with real time shadow-casting lighting from the sun and moon!**
- intensity-matching hemisphere light for a natural/appropriate ambient lighting to match the directional lighting
- all light sources can be enabled/disabled/adjusted, and have sane, natural feeling defaults (e.g., softer light from stars, soft light from moon)

# demos
- play with live functioning code [on glitch](https://glitch.com/edit/#!/a-super-sky-demo?path=index.html%3A1%3A0) ([as a page](https://a-super-sky-demo.glitch.me/))
- this repo's demo html: index.html in this repo [live](https://kylebakerio.github.io/a-super-sky/)

# compatibility

## System Resources + Performance
- runs easily in oculus quest 2's native browser. this even runs smoothly in google cardboard, it seems.
- to improve performance, set `cycleduration` as high as you are willing to, and then `throttle` as high as you can tolerate` before stuttering occurs.
- you can remove light sources and remove or reduce the shadow-casting sun to further lighten the load.
- you could also just use this statically instead of dynamically--when doing so, you can also pre-bake shadows for the environment, and only live calc shadows for e.g. your player's character, etc.

## A-Frame version
- Tested working with 1.0.4, 1.1.0, and 1.2.0.

# how to add

add sources to project:

### >= 1.2.0
add sources:
```html
    <script src="https://gitcdn.xyz/repo/aframevr/aframe/master/examples/test/shaders/shaders/sky.js"></script>
    <script src="https://gitcdn.xyz/repo/kylebakerio/a-super-sky/main/super-sky.js"></script>
```

### <= 1.1.0 (only tested as low as 1.0.4)
add to the above:
```html
     <script src="https://gitcdn.xyz/repo/handeyeco/aframe-star-system-component/master/index.js"></script>
```

then add a super-sky entity to your scene:
(it's recommended that you set `sunbeamTarget` to the selector that matches your user's camera)
```html
    <a-super-sky="cycleDuration: 1;  groundColor: #7BC8A4;";
     ></a-super-sky>
```
**minimum options you should set**
- `cycleduration` is how long 1 sun loop takes (in minutes). By default, a full day is twice this length.
- _recommended_: set `throttle` as high as you can before it starts looking choppy
- `groundcolor` should be set manually, and is used to calculate more realistic light color.
- see super-sky.js schema for other options. comments explain their use.
- see glitch demo or repo index.html (referenced above in this readme) for live examples if unclear.

if you want shadows, add the `shadow` component to entities that you want to cast shadows and receive shadows (allow shadows to be casted upon):
```html
    <a-sphere shadow="cast:true; receive:true;"></a-sphere>
    <a-plane shadow="cast:false; receive:true;"></a-plane>
```

# Tips & FAQ
## shadows & lighting
#### My ground is too shiny / the reflections from the sun/moon are too intense
Add 'roughness' to the material to reduce shininess. In my demos, for example, I use `material="roughness:.633"` on the `<a-plane>` that acts as the ground
#### Shadows cut off when I am not close enough to them
- Shadows aren't trivial and come with a cost. You can up the shadow render square with the `shadowsize` attribute, which underneath affects the `light.shadowCamera` left/right/top/bottom values. This is how many meters from the `sunbeamtarget` you calculate shadows from. Keep in mind that too large and the shadows get lower res... you'll need to start crafting some custom light/shadowCamera values here.
- You might also change the `sunbeamtarget` attribute, depending on your scene. This is the center of the invisible box around which shadows are calculated. By default, in this app, it's the user's view (so, `[camera]`), and the default is the `shadowsize` attribute of 15m (so, shadows are calculated within a 30m box around the user). If you only have things shadows should be cast from in the middle of the map, but want to see them even from far away, setting the target to the center of your map would work. This will make surface reflections during sunrise/sunset be a bit off, though, so probably compensate for that (e.g., add roughness to the appropriate material) to cover that up.
- You can consider obscuring the user's field of view so that they can rarely see out in the distance, as well, to prevent this from being an issue. (e.g., high features surround you, instead of wide open vistas).
#### It gets too dark at night
Add a light source if your scene can handle it, or adjust `starlightintensity` to a higher than default (.1) value (like .2) if you want to use fewer lights for higher performance/simplicity.
#### I get weird shadow artifacts
Look into [shadow bias](https://aframe.io/docs/1.2.0/components/light.html#configuring_shadows_shadowbias), and if you changed the default values for the `sunbeamdistance`, that's probably the cause.
#### How do I turn off shadows?
`showshadowlight='false'`
#### How do I keep shadows but make them higher performance?
make `shadowsize` smaller (default is 15), make `cycleduration` as high as you can make sense of, and then make `throttle` (default 10ms) as high as you can before the updates look choppy. Beyond that, change `shadowMapHeight` and `shadowMapWidth` of the `sunbeam` to a lower value (default is 1024; try 512, or even further down to 256).
#### My question isn't here.
You can file an issue, I'd be interested to hear. But honestly, you should probably see [the docs](https://aframe.io/docs/1.2.0/components/light.html#configuring-shadows) to dig deeper into this. I'm not an expert.
## other
#### How can I make the fog not apply to X?
[As per the docs](https://aframe.io/docs/1.2.0/components/fog.html), add `material="fog:false;"`.

# TODO:
#### spinny stuff
- better method for changing moon rise/set position than a-scene rotation? finishing implementing rotation option
- slightly rotate stars over the course of a night
- enable better control of sun/moon trajectory through sky (allow e.g. lower moon)

#### etc
- currently night is 3x the length of day. This would imitate only northern winters/southern summers that have 8 hours of daylight, e.g. 10am to 6pm. ability to tweak this would be desirable--maybe speeding up or skipping phases when neither sun nor moon
- finish implementing existing options, and add some more of them
- correct spelling of 'reileigh' to 'rayleigh' everywhere, pull request on main aframe repo to sky shader accordingly
- probably document schema options in readme
- try exponential fog
