[![](https://data.jsdelivr.com/v1/package/npm/a-super-sky/badge)](https://www.jsdelivr.com/package/npm/a-super-sky)
# a-super-sky

Fancy, lightweight, drop-in day-night sky component for A-Frame. Confirmed working with A-Frame 1.3.0.

Utilizes [a-sun-sky](https://supermedium.com/superframe/components/sun-sky/) and [aframe-star-system](https://github.com/handeyeco/aframe-star-system-component) for A-Frame <1.2.0 compatible stars; Also borrowed heavily from [aframe-environment-component](https://github.com/supermedium/aframe-environment-component/commit/ab99293ee54826923212aca0dfc112d35b64d970)'s "starry" preset, a static scene, that I used for the 1.2.0 stars and as a starting point to extrapolate fog color to light color. Beyond those, this library adds controls to enable and control animation, fog to create a more appealing (imo) star fade in/out effect, stronger sunset effect, and also adds a directional light entity that roughly tracks the sun/moon to allow shining a directional shadow-casting light source from the shader's "sun". Significant effort has been spent creating smooth transitions between all of these moving parts to create a coherent environment.

<a href='https://ko-fi.com/kylev' target='_blank'><img height='35' style='border:0px;height:46px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' /><a/>

![moonlight-promo-19](https://user-images.githubusercontent.com/6391152/127781724-e853270a-4137-4f92-953d-2b18089b691e.png)
![sunset-room-shadow](https://user-images.githubusercontent.com/6391152/127769302-772c0c2d-246e-4c7e-87dd-f4a94e7b77b7.png)

# features!
- highly performant out of the box even with maximum settings enabled, and **auto-throttles self** if sky is slow enough to allow.
- sunrise, daytime, and sunset feature beautiful rayleigh scattering colors in the sky
- `fog` creates feeling of creeping shadowy darkness after sunset, that then retreats as stars slowly fade into view and light the scene, without the cost of the equivalent shadows
- subtle 'colored' fog and lighting on the horizon adds a sense of depth and realism to the day and night's different stages
- moon also rises and sets, creating a blue rayleigh glow in the sky
- at dawn, stars gently fade out, sky stars to go from soft blues to pre-sawn reds, and then fog again comes in just to create a feeling of shadows retreating as sun rises
- **now with real time shadow-casting lighting from the sun and moon!**
- intensity-matching hemisphere light for a natural/appropriate ambient lighting to match the directional lighting
- all light sources can be enabled/disabled/adjusted, and have sane, natural feeling defaults (e.g., softer light from stars, soft light from moon)
- pause, play, speed up, slow down all possible
- calculate sky to align with any fixed epoch time, thereby making multi-user sync'd skies simple, as well as in-world consistency over many sessions

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
add to sources:
```html
    <script src="https://cdn.jsdelivr.net/npm/a-super-sky@1.1.1/super-sky.js"></script>
```

### <= 1.1.0 (only tested as low as 1.0.4)
add to the above:
```html
     <script src="https://cdn.jsdelivr.net/gh/matthewbryancurtis/aframe-star-system-component@db4f1030/index.js"></script>
```

then add a super-sky entity to your scene:
(it's recommended that you set `sunbeamTarget` to the selector that matches your user's camera)
```html
    <a-super-sky 
        cycleduration="1"
        groundcolor="#7BC8A4"
    ></a-super-sky>
```
if using the very popular [aframe environment component](https://github.com/supermedium/aframe-environment-component), make sure you tell it to not set a sky:

```html
    <a-entity environment="skyType:none; lighting:none; "></a-entity>
```

#### minimum options you should set
- `cycleduration` is how long 1 sun loop takes (in minutes). By default, a full day is twice this length. (if `mooncycle="false"`, it's 1x this length.)
- _optional_: set `throttle` as high as you can before it starts looking choppy. By default, it'll target 40 updates per second (throttle=25), but will proportionately auto-tune down from that if `cycleduration` starts to be longer than `10` (because that's when you stop needing 40 calcs per second to still get enough frames per arc angle in the sky for it to look smooth). You can set `super-sky-debug="true"` to see logging info about the auto-tune throttle state, or run `document.querySelector('[super-sky]').components['super-sky'].throttle` in your console. Net result: the longer your day, the lighter the computational load, and it'll always look smooth.
- `groundcolor` should be set manually, and is used to calculate more realistic light color.
- see super-sky.js schema for other options. comments explain their use.
- see glitch demo or repo index.html (referenced above in this readme) for live examples if unclear.

#### setting a static scene
- `targetfpd="0"` will mean the scene will freeze and not run any update calculations
- `startpercent=".25"` means you want the scene to be at the 25% of a full day/night cycle, while `.99` would be just before sunrise. `0` (default) is sunrise itself. `49` would be 1% before moon rises, `.75` would be 'moonset'. (If `mooncycle=false`, it's percent of just the sun rotation, instead of sun+moon rotations.)

if you want shadows, add the `shadow` component to entities that you want to cast shadows and receive shadows (allow shadows to be casted upon):
```html
    <a-sphere shadow="cast:true; receive:true;"></a-sphere>
    <a-plane shadow="cast:false; receive:true;"></a-plane>
```

## how does the auto-tuning work?
- Set `orbitduration` to whatever you want. The higher the number, the slower the sky. The slower the sky, the less often calculations need to be done to update it while still looking smooth.
- By default will auto-throttles sky calculation frequency according to duration--sets a 40fps cap by default, but will drop below that if 33 frames per degree of motion are being attained, which happens if the `orbitduration` starts to be above `11` (unit is in minutes), which would be 20 minutes for a day/night cycle if `mooncycle="true"`. You can see logged output regarding the tuning, throttle, fps, fpd (frames per degree), etc. when `super-sky-debug="true"`/.
- You can manually set the throttle if desired, instead, which sets the minimum milliseconds to wait between calculations. Alternatively, you can set `targetfpd` (target frames per degree) if desired.

## Updating values after init?
I want to assume it's somehow my fault, but for some reason in my tests `oldData` is almost always coming in as an empty object, and in general I'm observing very strange behavior when trying to use the 'correct' `update()` functionality for A-Frame components? I'll file an issue here, but in the meantime I've just worked around the issue...

### update speed of orbit without lurching sky
`document.querySelector('[super-sky]').components['super-sky'].updateOrbitDuration(.1)`
### pause sky suddenly
`document.querySelector('[super-sky]').components['super-sky'].updateOrbitDuration(10000)`
### play again
`document.querySelector('[super-sky]').components['super-sky'].updateOrbitDuration(.1)`
### sync user time?
Easiest way? Pick hardcoded 'starttime', 'orbitduration' and 'mooncycle' values for your app. Voila, if their browser has correct time, then it'll always be in sync for all users. Use the correct/same values at instantiation.

snap/sync after the fact can be done for now this way:
```js
// comp1
let user1Sky = JSON.stringify(document.querySelector('[super-sky]').components['super-sky'].shareSky())
        // "{\"mooncycle\":true,\"orbitduration\":1.1,\"starttime\":1628045331326}"
// comp2
let user1Sky = JSON.parse(
        "{\"mooncycle\":true,\"orbitduration\":1.1,\"starttime\":1628045331326}"
        );
document.querySelector('[super-sky]').components['super-sky'].data.mooncycle = user1Sky.mooncycle
document.querySelector('[super-sky]').components['super-sky'].updateOrbitDuration(user1Sky.orbitduration)
document.querySelector('[super-sky]').components['super-sky'].data.starttime = user1Sky.starttime
document.querySelector('[super-sky]').components['super-sky'].updateSkyEpoch()
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
#### How do I keep shadows but reduce their performance cost?
- make `shadowsize` smaller (default is 15)
- make `cycleduration` as high as you are willing to, and then make `throttle` (default 10ms) as high as you can before the updates look choppy.
- change `shadowMapHeight` and `shadowMapWidth` of the `sunbeam` to a lower value (default is 1024; try 512, or even further down to 256).
- remove other light sources, and/or reduce the number of items that `cast` and `receive` `shadow`.
#### My question isn't here.
You can file an issue, I'd be interested to hear. But honestly, you should probably see [the docs](https://aframe.io/docs/1.2.0/components/light.html#configuring-shadows) to dig deeper into this. I'm not an expert.
## other
#### How can I make the fog not apply to X?
[As per the docs](https://aframe.io/docs/1.2.0/components/fog.html), add `material="fog:false;"` to X.

#### How can I know what "time of day" it is?
```js
document.querySelector('[super-sky]').components['super-sky'].timeOfDay()
```

# TODO:
#### enable update functionality
- figure out why A-Frame's `update()` functionality seems completely borked? Have worked around it for now, but mostly updating values in a-frame inspector, for example, won't work. Perhaps related to setting `this.data` directly?
- add in features from https://github.com/EX3D/aframe-daylight-system !
- some minor stuff gets out of sync if you leave the tab and come back, or change the cycle duration--specifically, for example, the 'timeOfDay' functionality. 

#### spinny stuff
- better method for changing moon rise/set position than a-scene rotation? finishing implementing rotation option
- slightly rotate stars over the course of a night
- enable better control of sun/moon trajectory through sky (allow e.g. lower moon)

#### time of day hooks
- make it so that you can assign functions to be triggered at a given certain time of day.
- add in default example for crickets audio playing at night
- add in default example for shooting stars at night 

#### etc
- currently night is 3x the length of day. This would imitate only northern winters/southern summers that have 8 hours of daylight, e.g. 10am to 6pm. ability to tweak this would be desirable--maybe speeding up or skipping phases when neither sun nor moon
- environment component has ability to put sun on the shader anywhere in the sky (using 3x 0-360 inputs), but this code needs updating to allow that. Doing so would allow moon to not follow exact same path as sun, which would be nice. 
- finish implementing existing options, and add some more of them
- try [exponential fog](https://aframe.io/docs/1.2.0/components/fog.html) instead of linear.
