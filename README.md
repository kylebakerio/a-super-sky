

# a-super-sky
<a href='https://ko-fi.com/kylev' target='_blank'><img height='35' style='border:0px;height:46px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' /><a/>

fancy, lightweight, drop-in day-night sky component for A-Frame.
Utilizes [a-sun-sky](https://supermedium.com/superframe/components/sun-sky/) and [aframe-star-system](https://github.com/handeyeco/aframe-star-system-component) for A-Frame 1.1.0 compatible stars; Also borrowed heavily from [aframe-environment-component](https://github.com/supermedium/aframe-environment-component/commit/ab99293ee54826923212aca0dfc112d35b64d970)'s "starry" preset, a static scene, that I used for the 1.2.0 stars and as a starting point for some lighting and color concepts. Beyond those, this library adds fog to create a more appealing (imo) star fade in/out effect, stronger sunset effect, and also adds an entity that roughly tracks the sun/moon to allow shining a directional shadow-casting light source from the shader's "sun". Significant effort has been spent creating smooth transitions between all of these moving parts to create a coherent environment.

![moonlight-promo-19](https://user-images.githubusercontent.com/6391152/127781724-e853270a-4137-4f92-953d-2b18089b691e.png)
![sunset-room-shadow](https://user-images.githubusercontent.com/6391152/127769302-772c0c2d-246e-4c7e-87dd-f4a94e7b77b7.png)
![sunset4444](https://user-images.githubusercontent.com/6391152/127782078-414efd10-58e7-4e01-bc4a-73d12b3f531d.png)

# features!

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
- if desired, throttle to reduce resource needs, and just make cycleDuration longer to slow the day down to match.
- you can remove light sources and the shadow-casting sun to further lighten the load.

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
    <a-sky 
        super-sky="cycleDuration: 1;  groundColor: #7BC8A4;";
     ></a-sky>
```

if you want shadows, add the `shadow` component to entities that you want to cast shadows and receive shadows (allow shadows to be casted upon):
```html
    <a-sphere shadow="cast:true; receive:true;"></a-sphere>
    <a-plane shadow="cast:false; receive:true;"></a-plane>
```
- `cycleDuration` is how long 1 sun loop takes (in minutes). By default, a full day is twice this length.
- `groundColor` should be set manually, and is used to calculate more realistic light color.
- see super-sky.js schema for other options. comments explain their use.
- see glitch demo or repo index.html (referenced above in this readme) for live examples if unclear.


# TODO:
- better method for changing moon rise/set position than a-scene rotation? finishing implementing rotation option
- slightly rotate stars over the course of a night
- enable better control of sun/moon trajectory through sky (allow e.g. lower moon)
- more code cleanup and testing
- currently night is 3x the length of day. This would imitate only northern winters/southern summers that have 8 hours of daylight, e.g. 10am to 6pm. ability to tweak this would be desirable--maybe speeding up or skipping phases when neither sun nor moon
- finish building out options, update sources and demos to new version
- correct spelling of 'reileigh' to 'rayleigh' everywhere, pull request on main aframe repo
- new video showing improved version with shadows, but also correct lighting color and intensity gradients
- document schema options in readme
- explain how to work with shadowbox, point to shadow documentation
