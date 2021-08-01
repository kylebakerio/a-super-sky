const AFRAME = window.AFRAME
const THREE = window.THREE

AFRAME.registerComponent('super-sky', {
    schema: {
      cycleDuration: {
        // time for one sun cycle. If moon cycle is enabled, then a full day will be twice this length.
        type: 'number',
        default: 1, // in minutes
      },
      throttle: {
        // how much to throttle, if desired
        // higher values make sky computed less often, which will make sky 'choppy'
        // to tune for performance:
        // make cycle duration as long as possible first,
        // then increase throttle as high as you can before it starts looking jerky
        type: 'number',
        default: 10, // min ms to wait before recalculating sky change since last calculation; e.g., 10 = 100fps cap
      },      
      startTime: {
        // this will be auto-set to Date.now(), but you can specify a start time to sync the sky to other
        // users or to a consistent in-world epoch time.
        // not currently working
        type: 'number',
        default: 0,
      },
      skipPercentInit: {
        // percent of full day/night (or day, if moon cycle disabled) to skip at initialization
        // not currently working
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

      disableFog: {
        // not yet implemented
        type: 'boolean',
        default: false,
      },
      fogMin: {
        // how far you can see when night is at its darkest
        // which is, how close the shadows creep in to the user
        type: 'number',
        default: 70, // number from 0 -> 360
      },

      showStars: {
        // use if you want to show moon, but no stars
        type: 'boolean',
        default: true,
      },
      starCount: {
        // how many stars to show at night
        type: 'number',
        default: 2000,
      },
      starlightIntensity: {
        // used as minimum light intensity at any time of active lights, which is,
        // how bright ambient lighting is when only stars are out
        type: 'number',
        default: 0.1, //number from 0 to 1
      },
      starLoopStart: {
        // you shouldn't touch this.
        // sets offset (compare with no offset at 180) of when stars should rise and fog should creep in
        // code treats this as a constant, likely will break things if adjusted
        type: 'number',
        default: 200, // number from 0 -> 360; 180 is sunset
        // should have been 20, not 200. derp. that is where the forwarrd offset by ~2/8 comes from.
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
      groundColor: {
        // gets mixed in for calculations about sunlight colors, fog color
        type: 'color',
        default: '#553e35',
      },

      sunbeamDistance: {
        // how far away the shadow-casting sun is
        // while the shader for the sun/moon can be virtually any length,
        // if the sunbeam light source is too far away, shadows don't work properly
        // should always be at least a few meters smaller than the sunshaderDistance,
        // but no camera movement = any distance works, and less camera movement = more distance works
        type: 'number',
        default: 200,
      },
      starfieldDistance: {
        // how far away the stars are
        // correct distance is important to make sure fog shows/hides them with correct timing
        // should be within (so, smaller than) the sunshaderDistance
        // starfield depth will be auto-set to be the difference between starfield and shader,
        type: 'number',
        default: 200,        
      },
      sunshaderDistance: {
        // the 'sun'/'moon' you see is projected on the inside of a sphere. This can be any distance by itself,
        // however, if too close, you'll 'run into' it (creating a 'truman show' effect), but the further the discrepancy
        // between this and sunbeam, the more 'off' the shadows and reflections will feel from the shader
        type: 'number',
        default: 500,
      },

      sunbeamTarget: {
        // target of directional sunlight that casts shadows
        // see: https://aframe.io/docs/1.2.0/components/light.html#directional
        // and: https://threejs.org/docs/#api/en/lights/DirectionalLight
        type: 'string',
        default: "[camera]",
      },
      shadowSize: {
        // size of shadow-casting beam of directional light 
        // smaller is more performant, but cuts off shadow calculation within a tighter box around the target
        type: 'number',
        default: 15, // in meters
      },

      seed: {
        // currently only used for star position in AFRAME >=1.2.0
        type: 'number',
        default: 1,
      },
      
      // shader variations between night and day:
      // moonHeight // todo
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
      
     sunRise: {
        // where on the horizon the sun rises from
        // accomplishes this by rotating a-scene
        // experimental, may cause issues
        type: 'number',
        default: 0, // number from 0 -> 360
      },
      moonRise: {
        // where on the horizon the moon rises from
        // this is accomplished adding rotation to a-scene
        // experimental, may cause issues
        type: 'number',
        default: 45, // number from 0 -> 360
      },
      
      debug: {
        type: 'boolean',
        default: false,
      },
    },
    init: function () {
      this.el.setAttribute('id', 'super-sky')
      if (AFRAME.version === "1.0.4" || AFRAME.version === "1.1.0" || AFRAME.version[0] === "0") {
        if (this.data.debug) console.warn("detected pre 1.2.0, make sure to include star library (see readme)");
        this.version = 0;
      }
      else {
        if (this.data.debug) console.log("detected AFRAME >=1.2.0, highest tested is 1.2.0");
        this.version = 1;
      }
      
      this.sky = this.el;
      this.sky.setAttribute('id', 'star-sky');
      this.sky.setAttribute('opacity', 0);
      this.sky.setAttribute('radius', this.data.sunshaderDistance);
      this.sky.setAttribute('theta-length', 110);
      this.sky.setAttribute('material', 'shader', 'sky');
      // this.el.appendChild(this.sky);

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

      if (this.data.throttle) {
        this.tick = AFRAME.utils.throttleTick(this.tick, this.data.throttle, this);
      }
      

      // this.sky = this.starSky // document.createElement('a-sky');
      
      // if (this.version === 1) {
        // this.sky.setAttribute('material', 'shader', 'skyshader');
        // this.getSunSky().setAttribute('material','shader', this.version === 1 ? 'sky' : 'starSky');
      // } else {
        // this.getSunSky().setAttribute('material', 'shader', 'sunSky');
        // this.getSunSky().setAttribute('material','shader','sunSky');
        // this.getSunSky().setAttribute('geometry','primitive','sphere');
        // this.getSunSky().setAttribute('geometry','radius','1000');
      // }
      
      if (this.data.showHemiLight) {
        this.hemilight = document.createElement('a-entity');
        this.hemilight.setAttribute('id','hemilight');
        this.hemilight.setAttribute('position', '0 50 0');
        this.hemilight.setAttribute('light', {
          type: 'hemisphere',
          color: '#CEE4F0',
          intensity: 0.1
        });
        this.hemilight.setAttribute('visible', true /*this.environmentData.lighting !== 'none'*/);

        if (this.hemilight) this.hemilight.setAttribute('light', {groundColor: this.data.groundColor});
        this.el.appendChild(this.hemilight);
        this.activeLights.push(this.hemilight)
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
        this.activeLights.push(this.sunlight)
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
        this.activeLights.push(this.sunbeam)
      }
      
      // console.warn("setting fog new style, likely needs update")
      // this.el.sceneEl.setAttribute('fog', {
      //   // color: this.getFogColor(this.skyType, this.sunPos.y),
      //   color: this.getLightColor(),
      //   // far: (1.01 - this.environmentData.fog) * this.STAGE_SIZE * 2
      // });

      // temp
      // document.getElementById('sun').setAttribute('geometry', 'radius', 500);
      this.cachedSkyRadius = this.data.skyRadius // document.getElementById('sun').getAttribute('geometry').radius
    },

    activeLights: [],
  
    update(oldData) {
      if (this.data.groundColor != oldData.groundColor) {
        this.activeLights.forEach(el => {
          el.setAttribute('light', {'groundColor': this.data.groundColor});
        });
      }
    },

   // Custom Math.random() with seed. Given this.environmentData.seed and x, it always returns the same "random" number
    random: function (x) {
      return parseFloat('0.' + Math.sin(this.data.seed * 9999 * x).toString().substr(7));
    },

    createStars: function() {
      this.stars = document.createElement('a-entity');
      this.stars.id= 'stars';
      
      if (this.data.showStars && this.version === 0) {
        if (this.data.debug) console.log("appending old style star system")
        // this.starsOld = document.createElement('a-entity');
        // this.starsOld.setAttribute('id', 'stars');

        // this.getSunSky().setAttribute('material', 'shader', 'sunSky');
        // this.getSunSky().setAttribute('material','shader','sunSky');
        // this.getSunSky().setAttribute('geometry','primitive','sphere');
        // this.getSunSky().setAttribute('geometry','radius','1000');

        this.stars.setAttribute('star-system',{
          count: this.data.starCount, 
          radius: this.data.starfieldDistance,
          size: .25,
          depth: this.data.sunshaderDistance-this.data.starfieldDistance,
        });
        // this.el.appendChild(this.starsOld);
      }
      else {
        // initializes the BufferGeometry for the stars in >= AF 1.2.0 
        // code here is more or less pulled from aframe-environment-component
        var numStars = this.data.starCount;
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array( numStars * 3 );
        var radius = this.data.starfieldDistance;
        var v = new THREE.Vector3();
        for (var i = 0; i < positions.length; i += 3) {
          v.set(this.random(i + 23) - 0.5, this.random(i + 24), this.random(i + 25) - 0.5);
          v.normalize();
          v.multiplyScalar(radius);
          positions[i  ] = v.x;
          positions[i+1] = v.y;
          positions[i+2] = v.z;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setDrawRange(0, 0); // don't draw any yet
        var material = new THREE.PointsMaterial({size: 0.01, color: 0xCCCCCC, /*fog: false*/});
        this.stars.setObject3D('mesh', new THREE.Points(geometry, material));
      }
      this.el.appendChild(this.stars);
    },

    setStars: function (starCount = this.howManyStars()) {
      this.starlight = !!starCount;

      if ( (!this.stars) ){
        this.createStars();
      }
      if (this.data.debug) console.log("starcount",starCount)
      if (!this.version) {
        this.stars.setAttribute('star-system', "count", starCount);
      } else {
        this.stars.getObject3D('mesh').geometry.setDrawRange(0, starCount);
      }

      if (this.data.debug) console.log("setStars", starCount, this.starlight)
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
        // console.log('new eighth star', {
        //   eighth: this.currentEighth.which, 
        //   moon: this.moon, 
        //   starlight: this.starlight, 
        //   sunOrMoonUp: this.sunOrMoonUp(), 
        //   fog: this.fogValue, 
        //   intensity: this.lights.lightProps.intensity, 
        //   multiplier: this.lights.intensityMultiplier
        // })

        // document.querySelector('#log').setAttribute('value', "fog: "+this.fogValue)
        // document.querySelector('#log').setAttribute('value', 's: ' + this.currentEighthStarLoop.which + "/8; e: " + this.currentEighth.which + "/8")
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
      // on this loop, 0% @ 0/8 is sunrise, 100% @ 1/8 is sunset, 0% @ 4/8 is moonrise, 100% @ 5/8 is moonset

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
        // console.log('new eighth', {
        //   eighth: this.currentEighth.which, 
        //   moon: this.moon, 
        //   starlight: this.starlight, 
        //   sunOrMoonUp: this.sunOrMoonUp(), 
        //   fog: this.fogValue, 
        //   intensity: this.lights.lightProps.intensity, 
        //   multiplier: this.lights.intensityMultiplier
        // })

        
        // document.querySelector('#log').setAttribute('value', "fog: "+this.fogValue)
        // document.querySelector('#log').setAttribute('value', 's: ' + this.currentEighthStarLoop.which + "/8; e: " + this.currentEighth.which + "/8")
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

        this.moon = !this.moon;
        
        this.moonSunSwitchFlag = true;
        if (this.moon) {
          if (this.data.debug) console.log('switch to moon cycle, would rotate scene for moonrise')
          // this.el.sceneEl.setAttribute('rotation', {y:this.data.moonRise})
          
          if (this.data.showStars) {
            // show stars right after sunset
            this.setStars();
            
            if (this.data.debug) console.log('starlight on')
          }
        } else {
          if (this.data.debug) console.log('switch to sun cycle, would rotate scene for sunrise; feature removed')
          // this.el.sceneEl.setAttribute('rotation', {y:this.data.sunRise})
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

      if (this.currentEighthStarLoop.which === 2 || this.currentEighthStarLoop.which === 4) {
        // console.log("ready-to-detect-starlight-off", this.moon, this.starlight)
        // sunrise -> noon 
        // or
        // sunset -> starlight
        // less fog (so, higher fog value) as percent of this.currentEighth goes up
        this.fogValue = this.currentEighthStarLoop.percent * this.fogRangeMax
        if (this.data.showStars && !this.moon && this.starlight) {
            this.setStars(0);
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
    starlight: false, // dynamically set, indicates if stars are an active light source, which they are for 3/4s of the day/night cycle
    howManyStars() {
      // can be used to cause stars to drop out one by one, fog will obscure it
      return (1 - Math.max(0, ( this.sunPos.y + 0.08) * 8)) * this.data.starCount; 
    },

    sunPosition: {x:0,y:0,z:-1}, // dynamically set
    sunPos: {x:0,y:0,z:0}, // dynamically set
    theta: Math.PI * (-.25), // putting it at .5 changes to a sun that goes straight overhead, but shader only supports movement in its very small range 
    phi() {return (2 * Math.PI * ((this.orbit / 360) - 0.5))}, // percent of circumference
    // I think this 0.5 is the source of the offset by 2/8ths. it forces it to start at sunrise! // -.25 correspondes to noon, -0 corresponds to sunset

    tick() {
      this.orbit = this.getOrbit();
      if (this.data.moonCycle) {
        this.handleMoonCycle(this.orbit);
      }

      this.sunShaderTick();
      this.lightSourcesTick();
    },

    sunShaderTick() {
      // draw the surface of the sphere with sunrise/sunset/moonlight colors, and 'visible' sun/moon
      this.sunPosition.x = Math.cos(this.phi());
      this.sunPosition.y = Math.sin(this.phi()) * Math.sin(this.theta);
      
      this.setSunSkyMaterial()

      this.sky.setAttribute('material', this.sunSkyMaterial);      
    },
    sunSkyMaterial: {
      reileigh: 1,
      luminance: 1,
      turbidity: .8,
    },
    setSunSkyMaterial() {
      // adjusts sky factors to give variation between day and night
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
    },


    lights: { // set dynamically
      posSurface: {
        z: -1,
      },
      posBeam: {},
      posHemi: {},
      lightProps: {}, // all the same for now...
    },

    glc: {
      fogRatios: [        1,       0.5,      0.22,       0.1,      0.05,      0,        -1],
      lightColors: ['#C0CDCF', '#81ADC5', '#525e62', '#2a2d2d', '#141616', '#000', '#e3e1aa' /*'#fffed9'*/],
      starBrightRange: {start:{which:3},end:{which:6}}
      // moonsky: '#e3df8a', // '#fffcab',
    },
    
    // returns a light color from a specific sky type and sun height  
    getLightColor: function (getLight=false) { // if false, we're getting fog, not light
      // let lightColor;

      this.glc.sunHeight = Math.min(1, this.sunPosition.y); // to make sure it's never a value higher than 1, which shouldn't happen under normal conditions anyways
      this.glc.ratioA;
      this.glc.ratioB;
      this.glc.i = 0;
      for (; this.glc.i < this.glc.fogRatios.length; this.glc.i++){
        if (this.glc.sunHeight > this.glc.fogRatios[this.glc.i]){
          if (this.moon && this.glc.sunHeight > 0) { // moon is up
            this.glc.ratioA = -1; // lock to last two night colors while moon is up, instead of going through daylight colors
            this.glc.ratioB = 0;
            // never understood why this method wouldn't work, but found a different workaround that is doing well now.
            // var c1 = new THREE.Color(this.glc.lightColors[this.glc.lightColors.length-1]);
            // var c2 = new THREE.Color(this.glc.moonsky);
            this.glc.i = this.glc.fogRatios.length-1;
          } else { // sun or stars without moon
            this.glc.ratioA = this.glc.fogRatios[this.glc.i];
            this.glc.ratioB = this.glc.fogRatios[this.glc.i - 1];
          }
          this.glc.c1 = new THREE.Color(this.glc.lightColors[this.glc.i - 1]); // index 0 - 1? never happens-- it's never > 1 (max .7), so index 0 is only ever c1, can never be c2 missing a c1
          this.glc.c2 = new THREE.Color(this.glc.lightColors[this.glc.i]);

          this.glc.a = ((this.glc.sunHeight) - this.glc.ratioA) / (this.glc.ratioB - this.glc.ratioA); // how far are we on the path from color 1 to color 2
          this.glc.a = this.moon && this.glc.sunHeight > 0 ? (1 - (this.glc.a-1)) : this.glc.a; // handle negative sun range values
          if (this.inRange(this.glc.starBrightRange)) {
            // lock at certain shade of white while the stars are up
            if (this.glc.a > .29) this.glc.a = .29
          }
          // console.log(this.inRange(this.glc.starBrightRange))
          // if (this.glc.sunHeight < 0) this.glc.a = .99;
          // if (this.glc.sunHeight < 0) this.glc.a = this.glc.a-1//.99;
      
          // document.querySelector('#log').setAttribute('value', 
          //   this.glc.ratioA + "|" + this.glc.ratioB + "|"  + 
          //   ((this.moon && this.glc.sunHeight > 0) ?  this.glc.lightColors[this.glc.lightColors.length-1] : this.glc.lightColors[this.glc.i - 1]) + "|" + 
          //   " a:"+ this.cleanNumber(this.glc.a,100,!!'fixedlengthstring') + "|"+
          //   (/*(this.moon && this.glc.sunHeight > 0) ?  this.glc.moonsky : */this.glc.lightColors[this.glc.i])  +"|"+
          //   // '#' + lightColor.getHexString() +
          //   ((this.moon && this.glc.sunHeight > 0) ? "| moon" : "| day") 
          // )
          
          this.glc.c2.lerp(this.glc.c1, this.glc.a);
          this.glc.lightColor = this.glc.c2;
          break;
        }
      }

      // dim down the color
      this.glc.lightColor.multiplyScalar(getLight ? 1: 0.9);
      
      if (!getLight) { // therefore, getting fog
        // mix fog a bit with ground color; for light, this happens within the light component
        // lightColor.lerp(new THREE.Color(this.data.groundColor), 0.3);
        // removed, because it was always too 'bright'--wanted it more 'black' at night, not a halo
      }
      
      // document.querySelector('#color-show').setAttribute('material','color','#' + this.glc.lightColor.getHexString())
      // document.querySelector('#log2').setAttribute('value', this.glc.lightColor.getHexString())
      return '#' + this.glc.lightColor.getHexString();
    },

    inRange(startEnd){
      // utility function I built at the end, only used in one place so far, 
      // but actually a lot of code should be refactored to use this for increased clarity
      //
      // takes in object of type:
      // {start:{which:1,percent:.33}, end:{which:4,percent:.66}} 
      // (percent is optional)
      // limits are inclusive, so "start.which = 1; end.which = 4" (without percent) means from 0% of 1 until 100% of 4.
      //
      // does not currently allow start position that is after end position (start/end that loops through end)
      // to accomplish that, use two seperate ranges, from which=0 to end, and from start to which=8
      if (startEnd.start.which > this.currentEighth.which || startEnd.end.which < this.currentEighth.which) {
        return false
      } 
      if (!startEnd.start.hasOwnProperty('percent') && !startEnd.end.hasOwnProperty('percent')) {
        return true
      }
      if (startEnd.start.percent > this.currentEighth.percent || startEnd.end.percent < this.currentEighth.percent) {
        return false
      }
      else {
        return true
      }
    },

    lightSourcesTick() {
        // this.offset = this.moon ? this.data.moonRise : this.data.sunRise;
        // this.el.setAttribute('rotation', 'y', -this.offset)

        // update light colors and intensities
        this.sunPos = new THREE.Vector3(this.sunPosition.x, this.sunPosition.y, this.sunPosition.z)
        this.sunPos.normalize();
        
        if (!this.data.disableAllLighting) {
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
          

          this.lights.lightProps.color = this.getLightColor(1);

          // document.querySelector('#log2').setAttribute('value', this.lights.intensityMultiplier + " m=>i " + this.cleanNumber(this.lights.lightProps.intensity) + "  |s: " +  this.cleanNumber(this.sunPosition.y) + " |c " + this.lights.lightProps.color)
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
          this.sunshaderToSunbeam();
        }

        if (this.data.showHemiLight) {
          this.hemilight.setAttribute('light', this.lights.lightProps);
        }

        if (this.data.showShadowLight) {
          this.sunbeam.setAttribute('position', this.toD3);
          this.lights.lightProps.castShadow = this.sunOrMoonUp(); // should actually specify eighths where sun/moon are up.
          this.lights.lightProps.intensity = this.sunOrMoonUp() ? this.lights.lightProps.intensity : 0
          this.sunbeam.setAttribute('light', this.lights.lightProps);
        }
    },
    
    cN: 0,
    cleanNumber(n, f=100, fixedLengthString=false) {
      this.cN = Math.floor(n * f)/f;
      // console.log(f, this.cN, this.cN.toString().length < f.toString().length)
      return fixedLengthString ? this.fixedLength(this.cN,f.toString().length,"0") : this.cN;
    },
  
    fixedLength(input,length,padChar=" ") {
      let output = input.toString();
      if (typeof input === "number" && input < 1 && input != 0) {
        // console.log(output)
        output =  "."+output.split('.')[1].toString()
      }
      // console.log(input,output)
      while(output.length < length) {
        output+=padChar;
      }
      return output;
    },
    sunOrMoonUp() { 
      this.getEighth();
      return this.currentEighth.which === 0 || this.currentEighth.which === 1 || this.currentEighth.which === 4 || this.currentEighth.which === 5;
    },
    toD3: { x:0, y:0, z:0 }, // dynamically set
    sunshaderToSunbeam(/*x,y*/) {
      // using the same 0-360 orbit input, get x/y/z 3d vector to (mostly) match sun-sky's sun texture position 
      // note that the shader actually allows a very limited range for the sun/moon, and will ignore inputs outside of its range
      // this function won't, though, and trying to force the moon/sun beyond range will just cause the light source to go out of sync.
      this.toD3.x = ( (this.data.sunbeamDistance) * Math.sin(this.theta) * Math.cos(this.phi()) );
      this.toD3.y = ( this.data.sunbeamDistance) * Math.sin(this.theta) * Math.sin(this.phi() );
      this.toD3.z = -( (this.data.sunbeamDistance) * Math.cos(this.theta) );
    },
  
    moveSunrise(degrees) {
      // note on rotation: you can add scene rotation, and then negatively rotate the a-sun-sky sphere. 
      // rotating that sphere will rotate the path of the child sunbeam, but will not affect the shader, which is why you have to rotate the scene.
      // rotating scene can have strange side effects, though, if anything is placed with world position it will suddenly be out of place.
      if (this.data.debug) console.warn("rotating a-scene, likely problematic")
      // unfortunately, I don't yet see any other way to change the position of the sunrise...
      AFRAME.scenes[0].sceneEl.setAttribute('rotation','y',-degrees)
      this.sky.setAttribute('rotation','y',-degrees)
    },
});
