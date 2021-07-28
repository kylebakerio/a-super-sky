# a-super-sky
<a href='https://ko-fi.com/kylev' target='_blank'><img height='35' style='border:0px;height:46px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' /><a/>

fancy, lightweight, drop-in day-night sky component for A-Frame.
Utilizes [a-sun-sky](https://supermedium.com/superframe/components/sun-sky/) and [aframe-star-system](https://github.com/handeyeco/aframe-star-system-component).

![sunset with dynamic colored sky](https://i.imgur.com/tzEqI6B.png)
![luminous moon + blue sky + stars](https://i.imgur.com/w6847An.png)

# features
- sunrise, daytime, and sunset feature beautiful reileigh scattering colors in the sky
- `fog` component creates feeling of darkness after sunset, that then retreats as stars slowly fade into view
- moon rises and sets, creating a blue reileigh glow in the sky
- stars fade out, and then fog again comes in just to create a feeling of shadows retreating at dawn.

# compatibility

## System Resources
- runs easily in oculus quest 2's native browser. pretty sure it'll run in google cardboard, need to test further.
- to reduce resource demands, reduce `starCount` and add `throttle`.

## A-Frame version
doesn't seem to be working with A-Frame 1.2.0 because of THREE changes to THREE.geometry being removed.
otherwise, tested with aframe 1.0.4 and 1.1.0.

# how to add

add sources to project:
```
    <script src="/super-sky.js"></script> 
    <script src="https://unpkg.com/aframe-sun-sky@3.0.3/dist/aframe-sun-sky.js"></script>
    <script src="https://cdn.rawgit.com/matthewbryancurtis/aframe-star-system-component/db4f1030/index.js"></script>
```

then add sky to your scene:
```js
      <a-scene>
        <a-sun-sky 
        id="sun"
        material="side: back; reileigh: 1; luminance: 1;"
        super-sky="cycleDuration:.1; ";
        ></a-sun-sky>
      </a-scene>
```

see super-sky.js schema for options. comments explain their use.

- glitch example: https://a-super-sky.glitch.me/
- also see: index.html in this repo
- also see: https://kylebakerio.github.io/a-super-sky/

# TODO:
- cause sun/moon/stars to optionally affect scene lighting
- better method for changing moon rise/set position than a-scene rotation
- enable better control of sun/moon trajectory through sky
- code could be cleaner and more well tested--it's really something I shared as soon as I threw it together and got it working. "Better rough than never."
- slightly rotate world while stars are in sky to create star movement
- currently night is 3x the length of day. This would imitate only northern winters/southern summers that have 8 hours of daylight, e.g. 10am to 6pm. ability to tweak this would be desirable.
- moon with phases would be an excellent improvement.

