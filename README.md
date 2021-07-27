# a-super-sky
fancy, lightweight, drop-in day-night sky component for A-Frame

# compatibility

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
      <a-sun-sky 
        id="sun"
        material="side: back; reileigh: 1; luminance: 1;"
        super-sky="cycleDuration:.1; ";
      ></a-sun-sky>
```

see super-sky.js schema for options. comments explain their use.

- glitch example: https://a-super-sky.glitch.me/
- also see: index.html in this repo
- also see: https://kylebakerio.github.io/a-super-sky/

# TODO:
- better method for changing moon rise/set position than a-scene rotation
- enable better control of sun/moon trajectory through sky
- cause sun/moon/stars to optionally affect scene lighting
- code could be cleaner and more well tested--it's really something I shared as soon as I threw it together and got it working. "Better rough than never."