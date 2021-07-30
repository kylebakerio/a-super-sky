AFRAME.registerComponent('super-sky', {
    schema: {
      cycleDuration: {
        // time for one sun cycle. If moon cycle is enabled, then a full day will be twice this length.
        type: 'number',
        default: 1, // in minutes
      },
      startTime: {
        // this will be auto-set to Date.now(), but you can specify a start time to sync the sky to other
        // users or to a consistent 'real' time.
        type: 'number',
        default: 0,
      },
      skipPercentInit: {
        // percent of full day/night (or day, if moon cycle disabled) to skip at initialization
        type: 'number',
        default: 0,
      },
      moonCycle: {
        // turn on/off moon cycle; also turns off stars. Nights are 'just black' when false.
        // relies on setting and controlling 'fog' component for a-scene.
        // night becomes 3x length, and features a 'moon' for 1/3 of that
        type: 'boolean',
        default: true,
      },
      showStars: {
        type: 'boolean',
        default: true,
      },
      starCount: {
        // how many stars to show at night
        type: 'number',
        default: 500,
      },

      starLoopStart: {
        // you probably shouldn't touch this.
        // sets offset (compare with no offset at 180) of when stars should rise and fog should creep in
        type: 'number',
        default: 200, // number from 0 -> 360; 180 is sunset
        // should have been 20, not 200. derp. that is where the forwarrd offset by ~2/8 comes from.
      },
      sunRise: {
        // where on the horizon the sun rises from
        // accomplishes this by rotating a-scene
        type: 'number',
        default: 0, // number from 0 -> 360
      },
      moonRise: {
        // where on the horizon the moon rises from
        // this is accomplished adding rotation to a-scene
        type: 'number',
        default: 45, // number from 0 -> 360
      },
      fogMin: {
        // how far you can see when night is at its darkest
        type: 'number',
        default: 70, // number from 0 -> 360
      },
      throttle: {
        // how much to throttle, if desired
        type: 'number',
        default: 10, // min ms to wait before recalculating sky change since last calculation; 10 = 100fps cap
      },
      debug: {
        type: 'boolean',
        default: false,
      },
      groundColor: {
        // gets mixed in for calculations about sunlight color
        type: 'color',
        default: '#553e35',
      },
      
      showHemiLight: {
        type: 'boolean',
        default: true,
      },
      showSurfaceLight: {
        type: 'boolean',
        default: false,
      },
      showShadowLight: {
        type: 'boolean',
        default: true,
      },
      seed: {
        // currently only used for star position in AFRAME >=1.2.0
        type: 'number',
        default: 1,
      },
      skyRadius: {
        // how far away the shadow-casting sun is
        type: 'number',
        default: 100,
      },
      sunbeamTarget: {
        // target of directional sunlight that casts shadows
        // see: https://aframe.io/docs/1.2.0/components/light.html#directional
        // and: https://threejs.org/docs/#api/en/lights/DirectionalLight
        type: 'string',
        default: "",
      },
      shadowSize: {
        // size of shadow-casting beam of directional light 
        type: 'number',
        default: 10, // in meters
      },
      starlightIntensity: {
         // minimum light intensity at any time of active lights
        type: 'number',
        default: 0.2, //number from 0 to 1
      },


           //   this.el.setAttribute('material', 'reileigh', this.moon ? 0.1 : 1);
        //   this.el.setAttribute('material', 'luminance', this.moon ? 1.18 : 1);
        //   this.el.setAttribute('material', 'turbidity', this.moon ? .3 : .8);

      moonReileigh: {
         // minimum light intensity at any time of active lights
        type: 'number',
        default: 0.1, //number from 0 to 1
      },
      moonLuminance: {
         // minimum light intensity at any time of active lights
        type: 'number',
        default: 1.18, //number from 0 to 1
      },
      moonTurbidity: {
         // minimum light intensity at any time of active lights
        type: 'number',
        default: .3, //number from 0 to 1
      },
      sunReileigh: {
         // minimum light intensity at any time of active lights
        type: 'number',
        default: 1, //number from 0 to 1
      },
      sunLuminance: {
         // minimum light intensity at any time of active lights
        type: 'number',
        default: 1, //number from 0 to 1
      },
      sunTurbidity: {
         // minimum light intensity at any time of active lights
        type: 'number',
        default: 0.8, //number from 0 to 1
      },

    },
    init: function () {
      if (AFRAME.version === "1.0.4" || AFRAME.version === "1.1.0" || AFRAME.version[0] === "0") {
        if (this.data.debug) console.warn("detected pre 1.2.0, using old-style geometry for stars");
        this.version = 0;
      }
      else {
        if (this.data.debug) console.log("detected AFRAME >=1.2.0, highest tested is 1.2.0");
        this.version = 1;
      }

      this.starSky = document.createElement('a-sky');
      this.starSky.setAttribute('id', 'starSky');
      this.starSky.setAttribute('opacity', 0);
      this.el.sceneEl.appendChild(this.starSky);

      if (this.data.showStars && this.version === 0) {
        if (this.data.debug) console.log("appending old style star system")
        this.starsOld = document.createElement('a-entity');
        this.starsOld.setAttribute('id', 'stars');
        this.starsOld.setAttribute('star-system','count',0);
        this.el.sceneEl.appendChild(this.starsOld);
      }
      if (this.data.skipPercentInit) {
        console.warn("not yet working")
        this.data.startTime = Date.now() + ((this.data.skipPercentInit * (this.data.moonCycle ? 2 : 1)) * (this.data.cycleDuration * 1000 * 60));
      }
      else if (!this.data.startTime) {
        this.data.startTime = Date.now();
      }
      else if (this.data.debug) {
        console.log('will use custom startTime:', this.data.startTime)
      }
      // if (this.version === 1) {
      this.envInit();
      // }
      if (this.data.throttle) {
        this.tick = AFRAME.utils.throttleTick(this.tick, this.data.throttle, this);
      }
      
      // temp
      // document.getElementById('sun').setAttribute('geometry', 'radius', 500);
      this.cachedSkyRadius = this.data.skyRadius // document.getElementById('sun').getAttribute('geometry').radius
    },

    envInit() {
      this.STAGE_SIZE = 200;
      this.environmentData = {
        active: true, 
        skyType: 'atmosphere', 
        fog: 0.7, 
        shadow: true,
        // from env component
        // shadowSize: this.data.shadowSize,

        // skyColor: '#88c',
        // horizonColor: '#ddd',
        // lighting: 'distant', 

        // lightPosition: { x: 0, y: -0.01, z: -0.46}, // default built-in static sunrise position
        // lightPosition: this.data.sunPosition, // this.el.getAttribute('material', 'sunPosition'), // trying this instead, make sure first tick has run first or sunPosition is set before this runs

        // flatShading: false, 
        // playArea: 1, 
        // ground: 'hills', 
        // groundYScale: 3, 
        // groundTexture: 'none', 
        // groundColor: '#553e35', 
        // groundColor2: '#694439', 
        // dressingColor: '#795449', 
        // dressingScale: 5, 
      };

      // save current scene fog
      this.userFog = this.el.sceneEl.getAttribute('fog');
      this.skyType = this.environmentData.skyType;

      // create sky
      this.sky = this.starSky // document.createElement('a-sky');
      
      if (this.version === 1) {
        this.sky.setAttribute('radius', this.STAGE_SIZE);
        this.sky.setAttribute('theta-length', 110);
        // this.sky.classList.add('environment');

        // used to be set in update, just setting what I've interpreted here
        this.sky.setAttribute('material', 'shader', 'skyshader');
      }
      
      // stars are created when needed
      // if (this.stars) {
        // console.warn("probably need to update this code for our purposes")
        // this.stars.setAttribute('visible', true /*skyType == 'atmosphere'*/);
      // }
      
      if (this.data.showHemiLight) {
        // create lights (one ambient hemisphere light, and one directional for the sun)
        this.hemilight = document.createElement('a-entity');
        // this.hemilight.classList.add('environment');
        this.hemilight.setAttribute('id','hemilight');
        this.hemilight.setAttribute('position', '0 50 0');
        this.hemilight.setAttribute('light', {
          type: 'hemisphere',
          color: '#CEE4F0',
          intensity: 0.1
        });
        this.hemilight.setAttribute('visible', true /*this.environmentData.lighting !== 'none'*/);

        // moved from an update() check upon ground color change to here, as should probably only be run once since we'll have a consistent ground color
        // in theory, if we allow updating environment, we should probably move it back there.
        if (this.hemilight) this.hemilight.setAttribute('light', {groundColor: this.data.groundColor}); // this should probably only be run once
        this.el.appendChild(this.hemilight);
      }
      
      if (this.data.showSurfaceLight) {
        if (this.data.debug) {
          this.sunlight = document.createElement('a-sphere');
          const nose = document.createElement('a-cone');
          nose.setAttribute('position','z',1.15)
          nose.setAttribute('rotation',{'x':270, z:180})
          nose.setAttribute('scale',{x:.2,y:.2,z:.2})
          nose.setAttribute('material', 'color', 'blue')
          this.sunlight.appendChild(nose)
        } else {
          this.sunlight = document.createElement('a-entity');
        }

        // this.sunlight.classList.add('environment');
        this.sunlight.setAttribute('id','sunlight-directional');
        this.sunlight.setAttribute('light', {
          type:'directional', 
          intensity: 0.1,
          shadowCameraVisible: this.data.debug,
          castShadow: false /*this.environmentData.shadow*/,
          shadowCameraLeft: -this.data.shadowSize,
          shadowCameraBottom: -this.data.shadowSize,
          shadowCameraRight: this.data.shadowSize,
          shadowCameraTop: this.data.shadowSize
        });
        this.sunlight.setAttribute('visible', true /*this.environmentData.lighting !== 'none'*/);
        this.el.appendChild(this.sunlight);
      }
      
      if (this.data.showShadowLight) {
        this.sunbeam = document.createElement(this.data.debug ? 'a-sphere' : 'a-entity')
        this.sunbeam.setAttribute('light', {
          type: 'directional',
          intensity: 0.1, // dynamically set during the day
          groundColor: this.data.groundColor,
          
          shadowCameraVisible: this.data.debug,
          castShadow: true,
          
          shadowMapWidth: 1024,
          shadowMapHeight: 1024,
          shadowRadius: 1,

          shadowCameraLeft: -this.data.shadowSize,
          shadowCameraBottom: -this.data.shadowSize,
          shadowCameraRight: this.data.shadowSize,
          shadowCameraTop: this.data.shadowSize,
          target: this.data.sunbeamTarget || "[camera]", // '#the-cam', //
        });
        this.sunbeam.setAttribute('id', 'sunbeam')
        this.el.appendChild(this.sunbeam);
              // <a-sphere light="castShadow:true; type:directional; intensity:0.7; shadowCameraVisible:false;" id="sunbeam"  shadow="cast:false;" position="0 1.25 -5" radius="1.25" color="#EF2D5E"></a-sphere>
      }

      // add everything to the scene
      // this.el.setAttribute('visible', true /*this.environmentData.active*/);
    },
 
  
    update(oldData) {
      if (this.version === 1) {
        this.newLightUpdate(oldData);
      }
    },

   // Custom Math.random() with seed. Given this.environmentData.seed and x, it always returns the same "random" number
    random: function (x) {
      return parseFloat('0.' + Math.sin(this.data.seed * 9999 * x).toString().substr(7));
    },

    // initializes the BufferGeometry for the stars
    createStars: function() {
      var numStars = this.data.starCount;
      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array( numStars * 3 );
      var radius = this.STAGE_SIZE - 1;
      var v = new THREE.Vector3();
      for (var i = 0; i < positions.length; i += 3) {
        v.set(this.random(i + 23) - 0.5, this.random(i + 24), this.random(i + 25) - 0.5);
        v.normalize();
        v.multiplyScalar(radius);
        positions[i  ] = v.x;
        positions[i+1] = v.y;
        positions[i+2] = v.z;
      }
      // console.log(positions)
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setDrawRange(0, 0); // don't draw any yet
      var material = new THREE.PointsMaterial({size: 0.01, color: 0xCCCCCC, /*fog: false*/});
      this.stars.setObject3D('mesh', new THREE.Points(geometry, material));
    },

    setStars: function (starCount = this.howManyStars()) {
      console.log("setStars", starCount)
      if (!this.stars){
        this.stars = document.createElement('a-entity');
        this.stars.id= 'stars';
        this.createStars();
        this.el.appendChild(this.stars);
      }
      this.stars.getObject3D('mesh').geometry.setDrawRange(0, starCount);
    },

    newLightUpdate(oldData) { //on update()
      // update sky colors
//       if (this.skyType !== oldData.skyType ||
//         this.environmentData.skyColor != oldData.skyColor ||
//         this.environmentData.horizonColor != oldData.horizonColor
//       ) {
        
//         // if (skyType == 'gradient') {
//         //   mat.topColor = this.environmentData.skyColor;
//         //   mat.bottomColor = this.environmentData.horizonColor;
//         //   this.sky.setAttribute('material', this.mat);
//         // }

//         this.sky.setAttribute('material', 'shader', 'skyshader');
//       }


      // set fog color
      // if (this.environmentData.fog > 0) {
        console.warn("setting fog new style, likely needs update")
        this.el.sceneEl.setAttribute('fog', {
          // color: this.getFogColor(this.skyType, this.sunPos.y),
          color: this.getLightColor(),
          // far: (1.01 - this.environmentData.fog) * this.STAGE_SIZE * 2
        });
      // }
      // else {
        // this.el.sceneEl.removeAttribute('fog');
      // }
      
      // check if any parameter of the ground was changed, and update it
      if (this.data.groundColor != oldData.groundColor// ||
          // this.environmentData.groundColor2 != oldData.groundColor2 ||
          // this.environmentData.groundYScale != oldData.groundYScale ||
          // this.environmentData.groundTexture != oldData.groundTexture ||
          // this.environmentData.gridColor != oldData.gridColor ||
          // this.environmentData.grid != oldData.grid
          )
      {
        // this.updateGround(updateGroundGeometry);
        // set bounce light color to ground color
        this.hemilight.setAttribute('light', {'groundColor': this.data.groundColor}); // this should probably only be run once
      }

      // if (this.userFog) {
        // this.el.sceneEl.setAttribute('fog', this.userFog);
      // }
      // else {
        // this.el.sceneEl.removeAttribute('fog');
      // }
    },

    starCycle: 0, // dynamic
    fogValue: 0, // dynamic
    fogRangeMax: 1000,
    getOrbit() {
      // converts time passed into a fraction of 360, so 0,1,2...359,360,0,1...etc.
      this.msSinceStart = Date.now() - this.data.startTime;
      this.minSinceStart = this.msSinceStart / 1000 / 60;
      this.minIntoCycle = this.minSinceStart % this.data.cycleDuration;
      this.fractionOfCurrentCycleCycle = this.minIntoCycle * ( 1 / this.data.cycleDuration );
      return 360 * this.fractionOfCurrentCycleCycle;
    },
    // msToMin() {},
    // minToMs() {},

    moon: false,
    moonSunSwitchFlag: false,

    getEighthStarLoop() {
      // dividing day and night each into four cycles, we get 8 total cycles. 
      // returns a corresponding value from 0-7 for which eighth of day you are in
      // also returns what percent through that eighth you are

      // this one follows 20 degrees behind the 'real' loop
      // except for just before and after sunrise, when it returns modified values to adjust fog.
      // that part is a bit of a hack and should be adjusted, so: "todo"

      // 90 === 360/4
      this.quarterCount = Math.floor( this.starLoop / 90 );
      this.lastEighthStarLoop = this.currentEighthStarLoop;
      this.currentEighthStarLoop = {
        which: this.moon ? this.quarterCount + 4 : this.quarterCount,
        percent: ((this.starLoop % 90) * (1/90)),
      }

      if (this.currentEighthStarLoop.which === 1 && this.currentEighthStarLoop.percent > .65) {
        this.currentEighthStarLoop.which = 2; // cheap way to prevent fog from increasing even after sunrise
        this.currentEighthStarLoop.percent = .2 // speed up to cause fog pre-sunrise early
      }
      else if (this.currentEighthStarLoop.which === 2) {
        this.currentEighthStarLoop.percent = this.currentEighthStarLoop.percent < .2 ? 
          .2 : this.currentEighthStarLoop.percent; // matching up beginning of 2 with faux end of 1
        this.currentEighthStarLoop.percent = this.currentEighthStarLoop.percent < .5 ? 
          this.currentEighthStarLoop.percent * 2 : this.currentEighthStarLoop.percent // speed up to cause shadows pre-sunrise early
      }

      if (this.data.debug && this.lastEighthStarLoop.which !== this.currentEighthStarLoop.which) {
        console.log('new eighth star', {
          eighth: this.currentEighth.which, 
          moon: this.moon, 
          starlight: this.starlight, 
          sunOrMoonUp: this.sunOrMoonUp(), 
          fog: this.fogValue, 
          intensity: this.lights.lightProps.intensity, 
          multiplier: this.lights.intensityMultiplier
        })

        // document.querySelector('#log').setAttribute('value', "fog: "+this.fogValue)
        document.querySelector('#log').setAttribute('value', 's: ' + this.currentEighthStarLoop.which + "/8; e: " + this.currentEighth.which + "/8")
      }
    },
    currentEighthStarLoop: { // dynamically set
      which: 2,
      percent: 0.001,
    },
    
    secondHalf: false,
    getEighth() {
      // dividing day and night each into four cycles, we get 8 total cycles. 
      // returns a corresponding value from 0-7 for which eighth of day you are in
      // also returns what percent through that eighth you are

      // 90 === 360/4
      this.quarterCount = Math.floor( this.orbit / 90 );
      this.lastEighth = this.currentEighth;
      if ( (this.quarterCount === 0 && this.lastEighth.which === 3)
      || this.quarterCount === 0 && this.lastEighth.which === 7
      ) {
        this.secondHalf = !this.secondHalf
      }
      this.currentEighth = {
        which: this.secondHalf ? this.quarterCount + 4 : this.quarterCount,
        percent: ((this.orbit % 90) * (1/90)),
      }

      if (this.data.debug && this.lastEighth.which !== this.currentEighth.which) {
        console.log('new eighth', {
          eighth: this.currentEighth.which, 
          moon: this.moon, 
          starlight: this.starlight, 
          sunOrMoonUp: this.sunOrMoonUp(), 
          fog: this.fogValue, 
          intensity: this.lights.lightProps.intensity, 
          multiplier: this.lights.intensityMultiplier
        })

        
        // document.querySelector('#log').setAttribute('value', "fog: "+this.fogValue)
        document.querySelector('#log').setAttribute('value', 's: ' + this.currentEighthStarLoop.which + "/8; e: " + this.currentEighth.which + "/8")
      }
    },
    currentEighth: { // dynamically set
      which: 2,
      percent: 0.001,
    },
  
    handleMoonCycle(orbit) {
      if (orbit < this.data.starLoopStart && this.moonSunSwitchFlag) {
        this.moonSunSwitchFlag = false;
      }
      if (orbit > this.data.starLoopStart && !this.moonSunSwitchFlag) {
        if (this.data.debug) console.log("switching sun/moon", orbit, 'moon:', this.moon)
        // debugger

        this.moon = !this.moon;
        
        // may be one for v = 1, another for v = 0?
        // debugger
        // if (this.version === 0) {
        //   this.el.setAttribute('material', 'reileigh', this.moon ? 0.1 : 1);
        //   this.el.setAttribute('material', 'luminance', this.moon ? 1.18 : 1);
        //   this.el.setAttribute('material', 'turbidity', this.moon ? .3 : .8);
        // }
        // else {
        //   this.sky.setAttribute('material', 'reileigh', this.moon ? 0.1 : 1);
        //   this.sky.setAttribute('material', 'luminance', this.moon ? 1.18 : 1);
        //   this.sky.setAttribute('material', 'turbidity', this.moon ? .3 : .8);
        // }
        
        this.moonSunSwitchFlag = true;
        if (this.moon) {
          if (this.data.debug) console.log('switch to moon cycle, would rotate scene for moonrise')
          // this.el.sceneEl.setAttribute('rotation', {y:this.data.moonRise})
          
          if (this.data.showStars) {
            // show stars right after sunset
            if (this.version === 0) {
              this.starsOld.setAttribute('star-system', "count", this.data.starCount);
            } else {
              this.setStars(/*this.howManyStars()*/);
            }
            this.starlight = true;
            if (this.data.debug) console.log('starlight on')
          }
        } else {
          if (this.data.debug) console.log('switch to sun cycle, would rotate scene for sunrise; feature removed')
          // remove stars
          // this.el.sceneEl.setAttribute('rotation', {y:this.data.sunRise})
          // this.stars.setAttribute('star-system', "count", 0);
        }
      }

      // track star loop separately to have stars rise and fog come in offset just after sunset
      if (orbit > this.data.starLoopStart) {
        this.starLoop = orbit - this.data.starLoopStart;
      } else {
        this.starLoop = orbit + (360 - this.data.starLoopStart);
      }

      this.starCycle = this.starLoop * ( 1 / 180 ); // 0 -> 2 scale for the 0 -> 360 rotation; we do until 2 so that we can make it negative after 1.
      this.starCycle = this.starCycle > 1 ? 2 - this.starCycle : this.starCycle;

      // fog: 
      // - 0 just after sunset,
      // - 0 just before sunrise,
      // - 1 at full day
      // - 1 at full night
      this.getEighthStarLoop();      

      // if (this.currentEighth.which === 1 && this.currentEighth.percent > .65) {
      //   this.currentEighth.which = 2; // cheap way to prevent shadows from increasing even after sunrise
      //   this.currentEighth.percent = .2 // speed up to cause shadows pre-sunrise early
      // }
      // if (this.currentEighth.which === 2) {
      //   this.currentEighth.percent = this.currentEighth.percent < .2 ? .2 : this.currentEighth.percent; // matching up beginning of 2 with faux end of 1
      //   this.currentEighth.percent = this.currentEighth.percent * 2 // speed up to cause shadows pre-sunrise early
      // }

      if (this.currentEighthStarLoop.which === 2 || this.currentEighthStarLoop.which === 4) {
        // console.log("ready-to-detect-starlight-off", this.moon, this.starlight)
        // sunrise -> noon 
        // or
        // sunset -> starlight
        // less fog (so, higher fog value) as percent of this.currentEighth goes up
        this.fogValue = this.currentEighthStarLoop.percent * this.fogRangeMax
        if (this.data.showStars && !this.moon && this.starlight) {
            this.starlight = false;
            if (this.data.debug) {
              console.log('starlight off', this.fogValue, this.howManyStars())
            }
            if (this.version === 0) {
              this.starsOld.setAttribute('star-system', "count", 0);
            } else {
              this.setStars(0 /*this.howManyStars()*/);
            }
        }
      }
      else if (this.currentEighthStarLoop.which === 3 || this.currentEighthStarLoop.which === 1) {
        // noon -> sunset
        // or
        // dusk -> sunrise 
        // more fog (so, lower fog value) as percent of this.currentEighthStarLoop goes up
        this.fogValue = (1 - this.currentEighthStarLoop.percent) * this.fogRangeMax
      } 
      else {
        this.fogValue = this.fogRangeMax
      }
      // if (this.data.debug) console.log('fogValue', this.fogValue,  this.currentEighthStarLoop.percent, this.fogRangeMax)
      if (this.fogValue < this.data.fogMin) this.fogValue = this.data.fogMin;
      
      this.el.sceneEl.setAttribute('fog', 'far', this.fogValue);
    },
    starlight: false, // dynamically set
    howManyStars() {
      return (1 - Math.max(0, ( this.sunPos.y + 0.08) * 8)) * this.data.starCount; 
    },

    sunPosition: {x:0,y:0,z:-1}, // dynamically set
    sunPos: {x:0,y:0,z:0}, // dynamically set
    
    theta: Math.PI * (-.25), // putting it at .5 changes to a sun that goes straight overhead, but shader only supports movement in its very small range 
    phi() {return (2 * Math.PI * ((this.orbit / 360) - 0.5))}, // percent of circumference
    // this 0.5 is the source of the offset by 2/8ths! it forces it to start at sunrise! // -.25 correspondes to noon, -0 corresponds to sunset
    // a todo, to clean things up, would be removing this 0.5 and having it as a configurable offset (what time of day you want it to start at), but 
    // I've already written a lot of code off of this function, so that would be some work. later... maybe...

    tick() {
      this.orbit = this.getOrbit();
      if (this.data.moonCycle) {
        this.handleMoonCycle(this.orbit);
      }

      this.sunShaderTick();
      // this.el.setAttribute('material', 'sunPosition', this.sunPosition); // trying to ignore to allow this.sunPos, which is normalize()'d, in newLightTick() ?
      // might need to re-enable if not using 1.2.0 functions though
      this.lightSourcesTick();
    },

    sunShaderTick() {
      // draw the surface of the sphere with sunrise/sunset/moonlight colors, and 'visible' sun/moon
      this.sunPosition.x = Math.cos(this.phi());
      this.sunPosition.y = Math.sin(this.phi()) * Math.sin(this.theta);
      
      this.setSunSkyMaterial()
      this.sunSkyMaterial

      if (this.version === 0) {
        this.el.setAttribute('material', this.sunSkyMaterial);      
      } else {
        this.sky.setAttribute('material', this.sunSkyMaterial);      
      }
    },
    sunSkyMaterial: {
      reileigh: 1,
      luminance: 1,
      turbidity: .8,
    },
    setSunSkyMaterial() {
      // let label;
      
      if (this.currentEighthStarLoop.which === 1) {
        // 1
        // console.log("moon to sun", this.currentEighthStarLoop.which)
        // label = this.currentEighthStarLoop.which+' moon to sun; ';
        // from moon to sun
        this.sunSkyMaterial.reileigh = this.data.moonReileigh + (this.currentEighthStarLoop.percent * (this.data.sunReileigh - this.data.moonReileigh));
        this.sunSkyMaterial.luminance = this.data.moonLuminance + (this.currentEighthStarLoop.percent * (this.data.sunLuminance - this.data.moonLuminance));
        this.sunSkyMaterial.turbidity = this.data.moonTurbidity + (this.currentEighthStarLoop.percent * (this.data.sunTurbidity - this.data.moonTurbidity));
      }
      else if (this.currentEighthStarLoop.which === 2 || this.currentEighthStarLoop.which === 3) {
        // 2 3
        // console.log("sun", this.currentEighthStarLoop.which)
        // label = this.currentEighthStarLoop.which+' sun; ';
        // straight sun
        this.sunSkyMaterial.reileigh = this.data.sunReileigh
        this.sunSkyMaterial.luminance = this.data.sunLuminance
        this.sunSkyMaterial.turbidity = this.data.sunTurbidity
      }
      else if (this.currentEighthStarLoop.which === 4) {
        // 4
        // console.log('sun to moon')
        // sun to moon
        // label = this.currentEighthStarLoop.which+' sun to moon; ';
        // 1 -(0.24266666666666703 * (1 - 0.1))
        this.sunSkyMaterial.reileigh = (this.data.sunReileigh - (this.currentEighthStarLoop.percent * (this.data.sunReileigh - this.data.moonReileigh)) );
        this.sunSkyMaterial.luminance = (this.data.sunLuminance - (this.currentEighthStarLoop.percent * (this.data.sunLuminance - this.data.moonLuminance)) );
        this.sunSkyMaterial.turbidity = (this.data.sunTurbidity - (this.currentEighthStarLoop.percent * (this.data.sunTurbidity - this.data.moonTurbidity)) );
        // debugger;
      }
      else if (this.currentEighthStarLoop.which) {
        // 5 6 7 0
        // console.log('moon')
        // straight moon
        // label = this.currentEighthStarLoop.which+' moon; ';
        this.sunSkyMaterial.reileigh = this.data.moonReileigh
        this.sunSkyMaterial.luminance = this.data.moonLuminance
        this.sunSkyMaterial.turbidity = this.data.moonTurbidity
      }
      
      // document.querySelector('#log2').setAttribute('value', label+"r: " +`${this.sunSkyMaterial.reileigh}`+"; l:" +this.sunSkyMaterial.luminance+"; t:"+this.sunSkyMaterial.turbidity)
      // document.querySelector('#log').setAttribute('value', `sR:${this.data.sunReileigh} SL%:${Math.floor(this.currentEighthStarLoop.percent * 1000) / 1000} mR:${this.data.moonReileigh}`)
      // console.log(this.currentEighthStarLoop.which, this.sunSkyMaterial.reileigh, `${this.data.sunReileigh} -(${this.currentEighthStarLoop.percent} * (${this.data.sunReileigh} - ${this.data.moonReileigh}))`)

      this.sunSkyMaterial.sunPosition = this.sunPosition // this.version === 0 ? this.sunPosition : this.sunPos
      // if (this.version === 0) {
      //   this.el.setAttribute('material', 'sunPosition', this.sunPosition);      
      // } else {
      //   this.sky.setAttribute('material', 'sunPosition', this.sunPos); // this one does nothing... or does it...?
      // }
    },


    lights: { // set dynamically
      posSurface: {
        z: -1,
      },
      posBeam: {},
      posHemi: {},
      lightProps: {}, // all the same for now...
      // hemilight: {},
      // sunlight: {},
      // sunbeam: {},
    },

   
            //   this.lights.lightProps.color = 
            // this.moon && this.sunOrMoonUp() ? 
            //   '#fffcab' : // moonlight blue
            // this.starlight ? 
            //   '#fffed9' : // darker starlight blue

    gLC: {
      fogRatios: [        1,       0.5,      0.22,       0.1,      0.05,      0, -1],
      lightColors: ['#C0CDCF', '#81ADC5', '#525e62', '#2a2d2d', '#141616', '#000', '#fffed9'],
      moonsky: '#e3df8a', // '#fffcab',
    },
    // returns a light color from a specific sky type and sun height  
    getLightColor: function (getLight=false) { // if false, we're getting fog, not light
      let lightColor;
      // if (skyType == 'color' || skyType == 'none'){
      //   lightColor = new THREE.Color(this.environmentData.skyColor);
      // }
      // else if (skyType == 'gradient'){
      //   lightColor = new THREE.Color(this.environmentData.horizonColor);
      // }
      // else 
      // if (skyType == 'atmosphere')
      // {

      // if (this.sunPosition.y <= 0) {
        // document.querySelector('#log').setAttribute('value', "<=0")
        // document.querySelector('#log2').setAttribute('value', "#000")
        // return '#000';
      // }

      let sunHeight = Math.min(1, this.sunPosition.y); // to make sure it's never a value higher than 1, which shouldn't happen under normal conditions anyways
      let ratioA;
      let ratioB;
      let i = 0;
      for (; i < this.gLC.fogRatios.length; i++){
        if (sunHeight > this.gLC.fogRatios[i]){
          if (/*this.sunOrMoonUp() &&*/ this.moon && sunHeight > 0) { // moon is up
            ratioA = -1;
            ratioB = 0;
            // var c1 = new THREE.Color(this.gLC.lightColors[this.gLC.lightColors.length-1]);
            // var c2 = new THREE.Color(this.gLC.moonsky);
            i = this.gLC.fogRatios.length-1;
          } else { // sun or stars without moon
            ratioA = this.gLC.fogRatios[i];
            ratioB = this.gLC.fogRatios[i - 1];
          }
            var c1 = new THREE.Color(this.gLC.lightColors[i - 1]); // index 0 - 1? never happens-- it's never > 1 (max .7), so index 0 is only ever c1, can never be c2 missing a c1
            var c2 = new THREE.Color(this.gLC.lightColors[i]);

          var a = ((sunHeight) - ratioA) / (ratioB - ratioA); // how far are we on the path from color 1 to color 2
          // a = a > .99 ? (.7 - a-1) : a;
          a = this.moon && sunHeight > 0 ? (1 - (a-1)) : a;
          if (sunHeight < 0) a = .9
          // console.log(this.cleanNumber(a));
          try {
            // if (a === .99 && this.moon && sunHeight > 0 ) {
            //   c2.lerp(c1, NaN);
            // } else {
              c2.lerp(c1, a);
            // }
          } catch(e) {
            debugger
          }
          lightColor = c2;
          // ratio=i;
          break;
        }
      }
      // if (!lightColor) {
      //   lightColor = "#000"
      //   debugger
      // }
  
      // }
      // dim down the color
      lightColor.multiplyScalar(getLight ? 1: 0.9);
      
      if (!getLight) { // therefore, getting fog
        // mix fog a bit with ground color; for light, this happens within the light component
        // lightColor.lerp(new THREE.Color(this.data.groundColor), 0.3);
      }
      
      // document.querySelector('#log').setAttribute('value', 
      //   ratioA + "|" + ratioB + "|"  + 
      //   ((this.moon && sunHeight > 0) ?  this.gLC.lightColors[this.gLC.lightColors.length-1] : this.gLC.lightColors[i - 1]) + "|" + 
      //   " a:"+ this.cleanNumber(a) + "|"+
      //   ((this.moon && sunHeight > 0) ?  this.gLC.moonsky : this.gLC.lightColors[i])  +"|"+
      //   // '#' + lightColor.getHexString() +
      //   ((this.moon && sunHeight > 0) ? "| moon" : "| day") 
      // )
      document.querySelector('#color-show').setAttribute('material','color','#' + lightColor.getHexString())
      // document.querySelector('#log2').setAttribute('value', this.gLC.lightColors[i])
      return '#' + lightColor.getHexString();
    },


    lightSourcesTick() {
        // this.offset = this.moon ? this.data.moonRise : this.data.sunRise;
        // this.el.setAttribute('rotation', 'y', -this.offset)
        //   var skycol = new THREE.Color(this.environmentData.skyColor);
        //   skycol.r = (skycol.r + 1.0) / 2.0;
        //   skycol.g = (skycol.g + 1.0) / 2.0;
        //   skycol.b = (skycol.b + 1.0) / 2.0;
          // this.hemilight.setAttribute('light', {'color': '#' + skycol.getHexString()});
        //   this.sunlight.setAttribute('light', {'intensity': 0.6});

        // update light colors and intensities
        this.sunPos = new THREE.Vector3(this.sunPosition.x, this.sunPosition.y, this.sunPosition.z)
        this.sunPos.normalize();
        
        if (!this.data.disableAllLighting) {
          // this.lights.lightProps.intensity = this.starlight ? (this. sunOrMoonUp() ? 0.1 + this.sunPos.y * 0.1 : ) : 0.1 + this.sunPos.y * 0.5;
          this.lights.intensityMultiplier = 
            !this.moon && this.sunOrMoonUp() ? 
              0.5 : // daylight
            this.starlight && !this.sunOrMoonUp() ?
              0.005 : // stars pre-and-post moon
            this.moon && this.sunOrMoonUp() ?
              0.05 : // moon is up
              1 // shouldn't happen, flash to make reasoning error obvious
          this.lights.lightProps.intensity = this.starlight && !this.sunOrMoonUp() ? this.data.starlightIntensity : (0.1 + this.sunPos.y * this.lights.intensityMultiplier);
          this.lights.lightProps.intensity = this.lights.lightProps.intensity < this.data.starlightIntensity ? this.data.starlightIntensity : this.lights.lightProps.intensity;
          // document.getElementById('lamp').setAttribute('light',this.lights.lightProps);
          // console.log(this.lights.lightProps.intensity, this.lights.intensityMultiplier)
          

          this.lights.lightProps.color = 
            // this.moon && this.sunOrMoonUp() ? 
            //   '#fffcab' : // moonlight blue
            // this.starlight ? 
            //   '#fffed9' : // darker starlight blue
            this.getLightColor(1); // calculated color

          document.querySelector('#log2').setAttribute('value', this.lights.intensityMultiplier + " m=>i " + this.cleanNumber(this.lights.lightProps.intensity) + "  |s: " +  this.cleanNumber(this.sunPosition.y) + " |c " + this.lights.lightProps.color)
          delete this.lights.lightProps.castShadow; // delete because hemilight complains
        }
        // adding to garbage collection overhead--make all objects here into local re-used objects
        if (this.data.showSurfaceLight) {
          this.lights.posSurface.x = -this.sunPosition.x;
          this.lights.posSurface.y = this.sunPosition.y
          this.sunlight.setAttribute('position', this.lights.posSurface); // new experimental version 
          this.sunlight.setAttribute('light', this.lights.lightProps);
        }

        if (this.data.showHemiLight || this.data.showShadowLight) {
          this.sunshaderToD3();
        }

        if (this.data.showHemiLight) {
          this.hemilight.setAttribute('light', this.lights.lightProps);
          // this.hemilight.setAttribute('position', this.toD3); // experimental, moving instead of static hemilight
        }

        /*this.sunPosition.x, this.sunPosition.y*/
        if (this.data.showShadowLight) {
          // this.toD3 = new THREE.Vector3(this.toD3.x, this.toD3.y, this.toD3.z)
          // this.toD3.normalize();
          this.sunbeam.setAttribute('position', this.toD3);
          this.lights.lightProps.castShadow = this.sunOrMoonUp(); // should actually specify eighths where sun/moon are up.
          this.lights.lightProps.intensity = this.sunOrMoonUp() ? this.lights.lightProps.intensity : 0
          this.sunbeam.setAttribute('light', this.lights.lightProps);
        }
    },
    
    cleanNumber(n, f=100) {
       return Math.floor(n * f)/f;
    },
    sunOrMoonUp() { 
      this.getEighth();
      return this.currentEighth.which === 0 || this.currentEighth.which === 1 || this.currentEighth.which === 4 || this.currentEighth.which === 5;
    },
    cachedSkyRadius: 5000, // we should set this in this.data and make user configurable actually
    toD3: { x:0, y:0, z:0 }, // dynamically set
    sunshaderToD3(/*x,y*/) {
      // using the same 0-360 orbit input, get x/y/z 3d vector to (mostly) match sun-sky's sun texture position 
      this.toD3.x = ( (this.cachedSkyRadius) * Math.sin(this.theta) * Math.cos(this.phi()) );
      this.toD3.y = ( this.cachedSkyRadius) * Math.sin(this.theta) * Math.sin(this.phi() );
      this.toD3.z = -( (this.cachedSkyRadius) * Math.cos(this.theta) );
    },
    // d2Tod3(x,y) {
      // this.toD3.x = //( (this.cachedSkyRadius-10) * Math.sin(this.theta) * Math.cos(this.phi()) );
      // this.toD3.y = //(this.cachedSkyRadius-10) * Math.sin(this.theta) * Math.sin(this.phi());
      // this.toD3.z = //-((this.cachedSkyRadius-10) * Math.cos(this.theta));
    // },
});

// sunrise // 
// sunset // 
