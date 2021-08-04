const AFRAME = window.AFRAME
const THREE = window.THREE

AFRAME.registerPrimitive('a-super-sky', {
  defaultComponents: {
    // mimic the a-sky primitive, to paint our shader on the inside of a sphere as designed
    // https://github.com/aframevr/aframe/blob/master/src/extras/primitives/primitives/a-sky.js
    geometry: {
      primitive: 'sphere',
      // radius: 500, // see default 'sunshaderdistance' in component
      segmentsWidth: 64,
      segmentsHeight: 32
    },
    material: {
      // color: '#FFF',
      // shader: 'flat',
      side: 'back',
      npot: true
    },
    scale: '-1 1 1',
    'super-sky': {},
  },
  mappings: {
    orbitduration: 'super-sky.orbitduration',
    throttle: 'super-sky.throttle',
    targetfpd: 'super-sky.targetfpd',    
    starttime: 'super-sky.starttime',
    startpercent: 'super-sky.startpercent',
    mooncycle: 'super-sky.mooncycle',
    disablefog: 'super-sky.disablefog',
    fogmin: 'super-sky.fogmin',
    showstars: 'super-sky.showstars',
    starcount: 'super-sky.starcount',
    starlightintensity: 'super-sky.starlightintensity',
    starloopstart: 'super-sky.starloopstart',
    showhemilight: 'super-sky.showhemilight',
    showsurfacelight: 'super-sky.showsurfacelight',
    showshadowlight: 'super-sky.showshadowlight',
    groundcolor: 'super-sky.groundcolor',
    sunbeamdistance: 'super-sky.sunbeamdistance',
    starfielddistance: 'super-sky.starfielddistance',
    sunshaderdistance: 'super-sky.sunshaderdistance',
    sunbeamtarget: 'super-sky.sunbeamtarget',
    shadowsize: 'super-sky.shadowsize',
    seed: 'super-sky.seed',
    moonreileigh: 'super-sky.moonreileigh',
    moonluminance: 'super-sky.moonluminance',
    moonturbidity: 'super-sky.moonturbidity',
    moonintensity: 'super-sky.moonintensity',
    sunintensity: 'super-sky.sunintensity',
    sunreileigh: 'super-sky.sunreileigh',
    sunluminance: 'super-sky.sunluminance',
    sunturbidity: 'super-sky.sunturbidity',
    sunriseoffset: 'super-sky.sunriseoffset',
    moonriseoffset: 'super-sky.moonriseoffset',
    'super-sky-debug': 'super-sky.debug',
  }
});



AFRAME.registerComponent('super-sky', {
   schema: {
      orbitduration: {
        // time for one sun cycle. if moon cycle is enabled, then a full day will be twice this length.
        // set to `infinite`
        type: 'number',
        default: 1, // in minutes
      },
      throttle: { // overrides targetfpd if set
        // -1 means that throttle will be auto-set according to targetfpd
        
        // how much to throttle, if desired
        // higher values make sky computed less often, which will make sky 'choppy'
        // to tune for performance:
        // make cycle duration as long as possible first,
        // then increase throttle as high as you can before it starts looking jerky
        type: 'number',
        default: -1, // min ms to wait before recalculating sky change since last calculation; e.g., 10 = 100fps cap
      },
      targetfpd: { // fpd = frames per degree
        // -1 means that an auto-set value will be used
        // set to 0 to make scene static
        // fpd of '1' would mean the sun/moon will 'click' into each 1/360 position of its rotation, '2' would mean per .5 degree, and so on
        // sane value is usually around 10 (per 10th of a degree, attempt refresh)
        type: 'number',
        default: -1,
      },
      starttime: {
        // this will be auto-set to date.now(), but you can specify a start time to sync the sky to other
        // users or to a consistent in-world epoch time.
        type: 'number',
        default: 0,
      },
      startpercent: {
        // percent of full day/night (or day, if moon cycle disabled) to skip at initialization
        // .83 = start at 83% of a full cycle
        type: 'number',
        default: 0,
      },
      
      mooncycle: {
        // turn on/off moon cycle; also turns off stars. nights are 'just black' when false.
        // relies on setting and controlling 'fog' component for a-scene.
        // night becomes 3x length, and features a 'moon' for 1/3 of that
        type: 'boolean',
        default: true,
      },

      disablefog: {
        type: 'boolean',
        default: false,
      },
      fogmin: {
        // how far you can see when night is at its darkest
        // which is, how close the shadows creep in to the user
        type: 'number',
        default: 70, // number from 0 -> 360
      },

      showstars: {
        // use if you want to show moon, but no stars
        type: 'boolean',
        default: true,
      },
      starcount: {
        // how many stars to show at night
        type: 'number',
        default: 2000,
      },
      starlightintensity: {
        // used as minimum light intensity at any time of active lights, which is,
        // how bright ambient lighting is when only stars are out
        type: 'number',
        default: 0.2, //number from 0 to 1
      },
      moonintensity: {
        // how bright the actual light from the moon is
        // this is just a multiplier used, actual value is dynamic according to position in sky
        type: 'number',
        default: 0.05, //number from 0 to 1
      },
      sunintensity: {
        // how bright the actual light from the moon is
        // this is just a multiplier used, actual value is dynamic according to position in sky
        type: 'number',
        default: 0.5, //number from 0 to 1
      },
      starloopstart: {
        // you shouldn't touch this.
        // sets offset (compare with no offset at 180) of when stars should rise and fog should creep in
        // code treats this as a constant, likely will break things if adjusted
        type: 'number',
        default: 200, // number from 0 -> 360; 180 is sunset
        // should have been 20, not 200. derp. that is where the forwarrd offset by ~2/8 comes from.
      },

      showhemilight: {
        type: 'boolean',
        default: true,
      },
      showsurfacelight: {
        type: 'boolean',
        default: false,
      },
      showshadowlight: {
        type: 'boolean',
        default: true,
      },
      groundcolor: {
        // gets mixed in for calculations about sunlight colors, fog color
        type: 'color',
        default: '#553e35',
      },

      sunbeamdistance: {
        // how far away the shadow-casting sun is
        // while the shader for the sun/moon can be virtually any length,
        // if the sunbeam light source is too far away, shadows don't work properly
        // should always be at least a few meters smaller than the sunshaderdistance,
        // but no camera movement = any distance works, and less camera movement = more distance works
        type: 'number',
        default: 900,
      },
      starfielddistance: {
        // how far away the stars are
        // correct distance is important to make sure fog shows/hides them with correct timing
        // should be within (so, smaller than) the sunshaderdistance
        // starfield depth will be auto-set to be the difference between starfield and shader,
        type: 'number',
        default: 200,        
      },
      sunshaderdistance: {
        // the 'sun'/'moon' you see is projected on the inside of a sphere. this can be any distance by itself,
        // however, if too close, you'll 'run into' it (creating a 'truman show' effect), but the further the discrepancy
        // between this and sunbeam, the more 'off' the shadows and reflections will feel from the shader
        type: 'number',
        default: 1000,
      },
     
      sunbeamtarget: {
        // target of directional sunlight that casts shadows
        // see: https://aframe.io/docs/1.2.0/components/light.html#directional
        // and: https://threejs.org/docs/#api/en/lights/directionallight
        type: 'string',
        default: "[camera]",
      },
      shadowsize: {
        // size of shadow-casting beam of directional light 
        // smaller is more performant, but cuts off shadow calculation within a tighter box around the target
        type: 'number',
        default: 15, // in meters
      },

      seed: {
        // currently only used for star position in aframe >=1.2.0
        type: 'number',
        default: 1,
      },
      
      // shader variations between night and day:
      // moonheight // todo
      moonreileigh: {
        //number from 0 to 1; higher causes more red in the sky
        type: 'number',
        default: 0.1, 
      },
      moonluminance: {
        // recommended range: 1.09 to 1.19; 1.18 creates a beautiful halo; 1.19 creates a serene, simple moon; go higher, things get weird; go lower, skyline turns red 
        type: 'number',
        default: 1.18,
      },
      moonturbidity: {
         //number from 0 to 1 // moon aura size, especially at sunrise/sunset
        type: 'number',
        default: .3,
      },
      sunreileigh: {
        type: 'number',
        default: 1, //number from 0 to 1
      },
      sunluminance: {
        type: 'number',
        default: 1, //number from 0 to 1
      },
      sunturbidity: {
        type: 'number',
        default: 0.8, //number from 0 to 1
      },
      
     sunriseoffset: {
        // experimental, not recommended, problems if anything has absolute positioning
        // where on the horizon the sun rises from
        // accomplishes this by rotating a-scene
        type: 'number',
        default: 0, // number from 0 -> 360
      },
      moonriseoffset: {
        // experimental, not recommended, problems if anything has absolute positioning
        // where on the horizon the moon rises from
        // this is accomplished adding rotation to a-scene
        type: 'number',
        default: 45, // number from 0 -> 360
      },
      
      debug: {
        type: 'boolean',
        default: false,
      },
    },

    init: function () {
      // see update()
      this.el.classList.add('super-sky');
      this.tickBackup = this.tick;
      
      if (AFRAME.version === "1.0.4" || AFRAME.version === "1.1.0" || AFRAME.version[0] === "0") {
        if (this.data.debug) console.warn("detected pre 1.2.0, make sure to include star library (see readme)");
        this.version = 0;
      }
      else {
        if (this.data.debug) console.log("detected AFRAME >=1.2.0, highest tested is 1.2.0");
        this.version = 1;
      }
      
      this.sky = this.el;
      this.sky.classList.add('star-sky');
      this.sky.setAttribute('material', 'opacity', 0); // may not be necessary anymore
      this.sky.setAttribute('material', 'shader', 'sky');
      this.sky.setAttribute('geometry', 'thetaLength', 110);      
    },
  
    throttle: 0, // dynamically set
    // initializer functions, broken out from this.init() so that they can be re-called from update() if needed
    f: {
      setThrottle() {
        this.msPerDegree = (this.data.orbitduration/360)*1000*60;

        if (this.data.targetfpd === -1) {
          if (this.data.debug) console.log("no given targetfpd, will fall back to 40fps (throttle=25) / 60fpd cap default");
          this.data.targetfpd = this.msPerDegree / 25 // first aim for 40fps minimum, but...
          this.data.targetfpd = this.data.targetfpd > 60 ? 60 : this.data.targetfpd; // if we're getting more than 60 renders per degree, set the ceiling her to massively reduce renders
        }

        if (this.data.throttle !== -1) {
          if (this.data.debug) console.warn("custom throttle set, will ignore targetfpd")
          this.throttle = this.data.throttle;
          this.data.targetfpd = this.msPerDegree / this.throttle;
        }
        else if (this.data.targetfpd === 0) {
          if (this.data.debug) console.warn("static sky")
          this.tickBackup = this.tick;
          this.throttle = Infinity;
          return
        }
        else {
          this.throttle = this.msPerDegree / this.data.targetfpd;
        }
        
        this.fps = 1000/this.throttle;
        
        if (this.data.debug) {
          console.log(this.cleanNumber(this.msPerDegree),'ms per degree at',this.cleanNumber(this.data.targetfpd),',fpd; throttle:',this.cleanNumber(this.throttle),', fps:',this.cleanNumber(this.fps));
          if (this.throttle < 10 || this.fps > 60) console.warn("likely wasteful rendering; consider setting `targetfpd` below", this.cleanNumber(this.data.targetfpd / (15 / this.throttle)),"to optimize performance");
          else if (this.data.targetfpd < 60 && this.fps < 40) console.warn("animation may be choppy; if needed, consider increasing cycleduration, or setting `targetfpd` above", this.cleanNumber(this.data.targetfpd / (50 / this.throttle))+0.01,"to improve");
        }
        
        this.tick = AFRAME.utils.throttleTick(this.tickBackup, this.throttle, this);
      },
      startFromPercent() {
        if (this.data.startpercent < 0) this.data.startpercent = 1 - (-this.data.startpercent % 1) ;
        if (this.data.mooncycle && (this.data.startpercent % 1) >= .5) {
          this.secondHalf = true;
          this.moon = true;
        }
        this.moonSunSwitchFlag = false;
        const cycleInMs = (this.data.orbitduration * 1000 * 60) * (this.data.mooncycle ? 2 : 1)
        this.data.starttime = Date.now() - (this.data.startpercent * cycleInMs);
        this.getOrbit()
        this.setStarLoop()
// add stars if needed
        this.getEighth()
        this.getEighthStarLoop()
        
        if (this.inRange(this.ranges.extendedStarRange)) {
          console.warn("add stars")
          this.setStars()
        } else {
          console.warn("remove stars")
          this.setStars(0)
        }
        
        if (this.data.debug) {
          console.log("skipping first",`${this.data.startpercent*100}%`,(this.data.startpercent * cycleInMs)/1000,'seconds of orbitduration',cycleInMs/1000,Date.now(),'-',this.data.starttime)
          console.log(this.orbit,this.currentEighth,this.currentEighthStarLoop)
        }
      },
      hemilight(){
        this.hemilight = document.createElement('a-entity');
        this.hemilight.setAttribute('id','hemilight');
        this.hemilight.setAttribute('position', '0 50 0');
        this.hemilight.setAttribute('light', {
          type: 'hemisphere',
          color: '#CEE4F0',
          intensity: 0.1
        });
        this.hemilight.setAttribute('visible', true);

        if (this.hemilight) this.hemilight.setAttribute('light', {groundColor: this.data.groundcolor});
        this.el.appendChild(this.hemilight);
        this.activeLights.push(this.hemilight)
      },
      sunbeam() {
        this.sunbeam = document.createElement(this.data.debug ? 'a-sphere' : 'a-entity')
        this.sunbeam.setAttribute('light', {
          type: 'directional',
          intensity: 0.1, // dynamically set during the day
          groundColor: this.data.groundcolor,
          
          shadowCameraVisible: this.data.debug,
          castShadow: true,
          
          shadowMapWidth: 1024,
          shadowMapHeight: 1024,
          shadowRadius: 1,

          shadowCameraLeft: -this.data.shadowsize,
          shadowCameraBottom: -this.data.shadowsize,
          shadowCameraRight: this.data.shadowsize,
          shadowCameraTop: this.data.shadowsize,

          shadowCameraFar: this.data.sunbeamdistance + 100, // this.data.shadowsize, // shadowsize was not enough
          shadowCameraNear: this.data.sunbeamdistance - 100, // could probably safelu lower this substantially...

          target: this.data.sunbeamtarget || "[camera]",
        });
        this.sunbeam.setAttribute('id', 'sunbeam')
        // this.sunbeam.setAttribute('scale', '1 1 1')
        this.el.appendChild(this.sunbeam);
        this.activeLights.push(this.sunbeam)
      },
      surfaceLight() {
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

        this.sunlight.setAttribute('id','sunlight-noshadow');
        this.sunlight.setAttribute('light', {
          type:'directional', 
          intensity: 0.1,
          shadowCameraVisible: this.data.debug,
          castShadow: false,
          shadowCameraLeft: -this.data.shadowsize,
          shadowCameraBottom: -this.data.shadowsize,
          shadowCameraRight: this.data.shadowsize,
          shadowCameraTop: this.data.shadowsize
        });
        this.sunlight.setAttribute('visible', true);
        this.el.appendChild(this.sunlight);
        this.activeLights.push(this.sunlight)
      },
    },

    activeLights: [],
  
    // {
    //   orbitduration: 'super-sky.orbitduration',
    //   throttle: 'super-sky.throttle',
    //   targetfpd: 'super-sky.targetfpd',    
    //   starttime: 'super-sky.starttime',
    //   startpercent: 'super-sky.startpercent',
    //   mooncycle: 'super-sky.mooncycle',
    //   disablefog: 'super-sky.disablefog',
    //   fogmin: 'super-sky.fogmin',
    //   showstars: 'super-sky.showstars',
    //   starcount: 'super-sky.starcount',
    //   starlightintensity: 'super-sky.starlightintensity',
    //   starloopstart: 'super-sky.starloopstart',
    //   showhemilight: 'super-sky.showhemilight',
    //   showsurfacelight: 'super-sky.showsurfacelight',
    //   showshadowlight: 'super-sky.showshadowlight',
    //   groundcolor: 'super-sky.groundcolor',
    //   sunbeamdistance: 'super-sky.sunbeamdistance',
    //   starfielddistance: 'super-sky.starfielddistance',
    //   sunshaderdistance: 'super-sky.sunshaderdistance',
    //   sunbeamtarget: 'super-sky.sunbeamtarget',
    //   shadowsize: 'super-sky.shadowsize',
    //   seed: 'super-sky.seed',
    //   moonreileigh: 'super-sky.moonreileigh',
    //   moonluminance: 'super-sky.moonluminance',
    //   moonturbidity: 'super-sky.moonturbidity',
    //   moonintensity: 'super-sky.moonintensity',
    //   sunintensity: 'super-sky.sunintensity',
    //   sunreileigh: 'super-sky.sunreileigh',
    //   sunluminance: 'super-sky.sunluminance',
    //   sunturbidity: 'super-sky.sunturbidity',
    //   sunriseoffset: 'super-sky.sunriseoffset',
    //   moonriseoffset: 'super-sky.moonriseoffset',
    //   'super-sky-debug': 'super-sky.debug',
    // }
    changed(key) {
      return this.oldData[key] !== this.data[key]
    },
    isEmptyObject: function(testObj) {
      return (Object.keys(testObj).length === 0 && testObj.constructor === Object);
    },
    update(oldData) {
      // I think this should be handled differently, and is probably automatically handled by tick() behavior
      // if (this.data.groundcolor != oldData.groundcolor) {
      //   this.activeLights.forEach(el => {
      //     el.setAttribute('light', {'groundColor': this.data.groundcolor});
      //   });
      // }

      console.log('update dif', AFRAME.utils.diff (oldData, this.data))

      this.oldData = oldData;
      let firstUpdate = false;
      if (!this.firstUpdatePast) {
        this.firstUpdatePast = true;
        firstUpdate = true;
        // continue
      } else if (this.isEmptyObject(oldData)) {
        // attempts to prevent firing update whenever inspector is opened
        console.error("skipping update because of empty object...")
        return
      }
      
      if (!this.data.debug) {
        this.trackPerformanceBackup = this.trackPerformance;
        this.trackPerformance = () => {};
      } else if (this.trackPerformanceBackup) {
        this.trackPerformance = this.trackPerformanceBackup;
      }
      
      if (this.changed('throttle') || this.changed('targetfpd')) {
        console.warn("throttle/targetfpd update")
        if (oldData.targetfpd === 0 && this.data.targetfpd !== 0) this.tick = this.tickBackup; // restore tick to attempt to allow restarting from static scene
        this.f.setThrottle.bind(this)()
      }
      
      if (this.changed('mooncycle') && !firstUpdate && !this.data.mooncycle) {
        // turning off moon cycle
        this.data.startpercent = this.orbit / 360;
        this.f.startFromPercent.bind(this)();
        this.tickHandlers() // flip one frame forward to show the change while paused from inspector
        // this.tickBackup(); 
      }

      if (!this.data.starttime) {
        if (this.data.debug) console.log('no custom starttime:', this.data.starttime)
        this.data.starttime = Date.now();
      }
      else if (this.changed('starttime')) {
        if (this.data.debug) console.log('will use custom starttime:', this.data.starttime)
        // do we even need to do anything? We could prevent 'jerk' by pausing until the times match, perhaps? Or just slow down by half until times match...?
        // probably 80/20 is to just ramp up/down fog
        // and run this.init?
        
        // new idea, we now have implemented .updateOrbitDuration(10)
        // so just do double their orbitduration until percent, and then back to same speed.
        // increased fog might also be nice, though.
        this.updateSkyEpoch()
      }
      else if (this.changed('startpercent')) {
        if (this.data.debug) console.log('will use custom startpercent:', this.data.starttime)
        
        this.f.startFromPercent.bind(this)();
      }
    
      
      if (this.changed('showhemilight')) {
        console.warn("hemi light change update")
        if (this.hemilight) this.el.removeChild(this.hemilight)
        if (this.data.showhemilight) this.f.hemilight.bind(this)();
      }
      if (this.changed('showsurfacelight')) {
        console.warn("surface light change update")
        if (this.sunlight) this.el.removeChild(this.sunlight)
        if (this.data.showsurfacelight) this.f.surfaceLight.bind(this)();
      }
      if (this.changed('showshadowlight') || this.changed('shadowsize')) {
        console.warn("sunbeam light change update")
        if (this.sunbeam) this.el.removeChild(this.sunbeam)
        if (this.data.showshadowlight) this.f.sunbeam.bind(this)();
      }
      if (this.changed('sunshaderdistance')) {
        console.warn("sunshader update")
        this.sky.setAttribute('geometry', 'radius', this.data.sunshaderdistance);
      }
      if (this.changed('sunbeamtarget')) {
        console.warn("sunbeamtarget update")
        this.sunbeam.setAttribute('light', 'target', this.data.sunbeamtarget)
      }
      
      if (firstUpdate) return
      // else
      // put things that should run on first update below this point
      
      if (this.changed('orbitduration')) {
        // for some reason, update() seems very broken, and this condition will only reliably fire the first time. needs to be done manually in another function, it seems.
        this.updateOrbitDuration();
      }
      if (this.changed('starfielddistance') || this.changed('seed')) {
        console.warn("starfield update")
        if (this.stars) {
          this.el.removeChild(this.stars);
          delete this.stars;
        }
        // no need to add them in, when `this.setStars()` is called, it'll create correctly as needed
      }
      
      if (
        this.changed('moonreileigh') ||
        this.changed('moonluminance') ||
        this.changed('moonturbidity') ||
        this.changed('sunreileigh') ||
        this.changed('sunluminance') ||
        this.changed('sunturbidity') 
      ) {
        console.warn("shader update")
        this.sunShaderTick()
      }
      
      if (
        this.changed('groundcolor') ||
        this.changed('moonintensity') ||
        this.changed('sunintensity') ||
        this.changed('starlightintensity') ||
        this.changed('debug') //|| // debug, because we change some stuff for e.g. showing shadowcamera
        // this.changed('sunturbidity') 
      ) {
        console.warn("light color/brightness update")
        this.lightSourcesTick()
      }
      
    },
  
    updateOrbitDuration(newOrbitDuration) {
      if (newOrbitDuration) {
        this.data.orbitduration = newOrbitDuration;
      }
      console.warn("experimental: orbit duration shift without jerk?")
      const denom = this.data.mooncycle ? 8 : 4;
      this.data.startpercent = ((this.currentEighth.which+1) / denom) - ((1-this.currentEighth.percent)/denom)
      console.log('current percent through cycle:',this.data.startpercent)
      // this.f.startFromPercent.bind(this)();
      // this.tickHandlers() // flip one frame forward to show the change while paused from inspector
      console.warn('will clear old targetfpd and auto-calc new value')
      this.data.targetfpd = -1
      this.data.throttle = -1
      this.f.setThrottle.bind(this)()
      this.f.startFromPercent.bind(this)();
    },
    
    shareSky() {
      return {
        mooncycle: this.data.mooncycle,
        orbitduration: this.data.orbitduration,
        starttime: this.data.starttime,
      };
    },
    updateSkyEpoch(newStartTime=this.data.starttime){
      // set moon cycle      
      // set orbit duration
      // set starttime
      // call this function
      // e.g.,
      /*
        screen1:
        JSON.stringify(document.querySelector('[super-sky]').components['super-sky'].shareSky())
        
        screen2:
        let user1Sky = JSON.parse(
        
        )
        document.querySelector('[super-sky]').components['super-sky'].data.mooncycle = user1Sky.mooncycle
        document.querySelector('[super-sky]').components['super-sky'].updateOrbitDuration(user1Sky.orbitduration)
        document.querySelector('[super-sky]').components['super-sky'].data.starttime = user1Sky.starttime
        document.querySelector('[super-sky]').components['super-sky'].updateSkyEpoch()
      */
      this.data.startpercent = this.timestampToOrbitPercent(newStartTime, this.data.mooncycle);
      console.warn("will attempt to start with new time percent", this.data.startpercent)
      this.f.startFromPercent.bind(this)();
    },
    
  
   // Custom Math.random() with seed. Given this.environmentData.seed and x, it always returns the same "random" number
    random: function (x) {
      return parseFloat('0.' + Math.sin(this.data.seed * 9999 * x).toString().substr(7));
    },

    createStars: function() {
      this.stars = document.createElement('a-entity');
      this.stars.setAttribute('id','stars');
      
      if (this.data.showstars && this.version === 0) {
        if (this.data.debug) console.log("appending old style star system")
        // this.starsOld = document.createElement('a-entity');
        // this.starsOld.setAttribute('id', 'stars');

        // this.getSunSky().setAttribute('material', 'shader', 'sunSky');
        // this.getSunSky().setAttribute('material','shader','sunSky');
        // this.getSunSky().setAttribute('geometry','primitive','sphere');
        // this.getSunSky().setAttribute('geometry','radius','1000');

        this.stars.setAttribute('star-system',{
          count: this.data.starcount, 
          radius: this.data.starfielddistance,
          size: .25,
          depth: this.data.sunshaderdistance-this.data.starfielddistance,
        });
        // this.el.appendChild(this.starsOld);
      }
      else {
        if (this.data.debug) console.log("appending new style star geometry")
        // initializes the BufferGeometry for the stars in >= AF 1.2.0 
        // code here is more or less pulled from aframe-environment-component
        var numStars = this.data.starcount;
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array( numStars * 3 );
        var radius = this.data.starfielddistance;
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
        var material = new THREE.PointsMaterial({size: 0.01, color: 0xCCCCCC, fog: false});
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
    
    timestampToOrbitPercent(timestamp, x2) {
      this.msSinceStart = Date.now() - (timestamp||this.data.starttime);
      this.minSinceStart = this.msSinceStart / 1000 / 60;
      this.minIntoCycle = this.minSinceStart % (this.data.orbitduration * (x2 ? 2:1));
      this.fractionOfCurrentCycle = this.minIntoCycle * ( 1 / (this.data.orbitduration * (x2 ? 2:1)) );
      return this.fractionOfCurrentCycle;
    },
    getOrbit(other) {
      // converts time passed into a fraction of 360, so 0,1,2...359,360,0,1...etc.
      // if (this.fractionOfCurrentCycle < 0) this.fractionOfCurrentCycle = -this.fractionOfCurrentCycle // might be wrong, just a test
      this.orbit = 360 * this.timestampToOrbitPercent();
      return this.orbit;
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
      if (this.data.mooncycle &&
        (this.quarterCount === 0 && this.lastEighth.which === 3)
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
          fog: this.fogValue, 
          intensity: this.lights.intensity, 
          multiplier: this.lights.intensityMultiplier
        })
      }
    },
    currentEighth: { // dynamically set
      which: 0,
      percent: 0.001,
    },
  
    setStarLoop() {
      // this was early code; would be nice to refactor this to this.inRange()
      if (this.orbit > this.data.starloopstart) {
        this.starLoop = this.orbit - this.data.starloopstart;
      } else {
        this.starLoop = this.orbit + (360 - this.data.starloopstart);
      }
    },
  
    handleMoonCycle(orbit) {
      if (orbit < this.data.starloopstart && this.moonSunSwitchFlag) {
        this.moonSunSwitchFlag = false;
      }
      if (orbit > this.data.starloopstart && !this.moonSunSwitchFlag) {
        if (this.data.debug) console.log("switching sun/moon", orbit, 'moon:', this.moon)

        this.moon = !this.moon;
        
        this.moonSunSwitchFlag = true;
        if (this.moon) {
          if (this.data.debug) console.log('switch to moon cycle, would rotate scene for moonrise')
          // this.el.sceneEl.setAttribute('rotation', {y:this.data.moonriseOffset})
          
          if (this.data.showstars) {
            // show stars right after sunset
            this.setStars();
            
            if (this.data.debug) console.log('starlight on')
          }
        } else {
          if (this.data.debug) console.log('switch to sun cycle, would rotate scene for sunrise; feature removed')
          // this.el.sceneEl.setAttribute('rotation', {y:this.data.sunriseOffset})
        }
      }

      // track star loop separately to have stars rise and fog come in offset just after sunset
      this.setStarLoop();

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
        if (this.data.showstars && !this.moon && this.starlight) {
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
      if (this.fogValue < this.data.fogmin) this.fogValue = this.data.fogmin;
      
      if (!this.data.disablefog) {
        this.el.sceneEl.setAttribute('fog', 'far', this.fogValue);
      }
    },
    starlight: false, // dynamically set, indicates if stars are an active light source, which they are for 3/4s of the day/night cycle
    howManyStars() {
      // can be used to cause stars to drop out one by one, fog creates more attractive effect, though.
      return this.data.starcount; 
      // return (1 - Math.max(0, ( this.sunPos.y + 0.08) * 8)) * this.data.starcount; 
    },

    sunPosition: {x:0,y:0,z:-1}, // dynamically set
    sunPos: {x:0,y:0,z:0}, // dynamically set
    theta: Math.PI * (-.25), // putting it at .5 changes to a sun that goes straight overhead, but shader only supports movement in its very small range 
    phi() {return (2 * Math.PI * ((this.orbit / 360) - 0.5))}, // percent of circumference
    // I think this 0.5 is the source of the offset by 2/8ths. it forces it to start at sunrise! // -.25 correspondes to noon, -0 corresponds to sunset
    
    lastTick: Date.now(),
    slowTickBuildup: 0,
    tolerance: -10, // normal ms delay
    notified: false,
    trackPerformance() {
      // NOTE: DOES NOT RUN UNLESS DEBUG ENABLED
      // console.log(this.throttle - (Date.now()-this.lastTick),this.tolerance)
      if (this.throttle - (Date.now()-this.lastTick) < this.tolerance) {
        // if (this.data.debug) console.warn("slow tick")
        this.slowTickBuildup++
      } else if (this.slowTickBuildup > 0) {
        this.slowTickBuildup--
      }
      if (this.slowTickBuildup > 5) {
        if (!this.notified)
        if (this.data.debug) console.error("demands may be too high, should increase throttle and reduce cycleduration", this.slowTickBuildup, this.throttle, this.throttle - (Date.now()-this.lastTick) )
        this.notified = true;
      }
      else if (!this.slowTickBuildup) this.notified = false;

      this.lastTick = Date.now();
    },
    tick() {
      this.trackPerformance()
      this.orbit = this.getOrbit();
      
      this.tickHandlers(); // why? so we can call 'tick' when changing settings but without updating the orbit, if we are paused.
    },
    tickHandlers(){
      if (this.data.mooncycle) {
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
    sunSkyMaterial: { // dynamically set
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
        this.sunSkyMaterial.reileigh = this.data.moonreileigh + (this.currentEighthStarLoop.percent * (this.data.sunreileigh - this.data.moonreileigh));
        this.sunSkyMaterial.luminance = this.data.moonluminance + (this.currentEighthStarLoop.percent * (this.data.sunluminance - this.data.moonluminance));
        this.sunSkyMaterial.turbidity = this.data.moonturbidity + (this.currentEighthStarLoop.percent * (this.data.sunturbidity - this.data.moonturbidity));
      }
      else if (this.currentEighthStarLoop.which === 2 || this.currentEighthStarLoop.which === 3) {
        // 2 3
        // console.log("sun", this.currentEighthStarLoop.which)
        // label = this.currentEighthStarLoop.which+' sun; ';
        // straight sun
        this.sunSkyMaterial.reileigh = this.data.sunreileigh
        this.sunSkyMaterial.luminance = this.data.sunluminance
        this.sunSkyMaterial.turbidity = this.data.sunturbidity
      }
      else if (this.currentEighthStarLoop.which === 4) {
        // 4
        // console.log('sun to moon')
        // sun to moon
        // label = this.currentEighthStarLoop.which+' sun to moon; ';
        // 1 -(0.24266666666666703 * (1 - 0.1))
        this.sunSkyMaterial.reileigh = (this.data.sunreileigh - (this.currentEighthStarLoop.percent * (this.data.sunreileigh - this.data.moonreileigh)) );
        this.sunSkyMaterial.luminance = (this.data.sunluminance - (this.currentEighthStarLoop.percent * (this.data.sunluminance - this.data.moonluminance)) );
        this.sunSkyMaterial.turbidity = (this.data.sunturbidity - (this.currentEighthStarLoop.percent * (this.data.sunturbidity - this.data.moonturbidity)) );
        // debugger;
      }
      else if (this.currentEighthStarLoop.which) {
        // 5 6 7 0
        // console.log('moon')
        // straight moon
        // label = this.currentEighthStarLoop.which+' moon; ';
        this.sunSkyMaterial.reileigh = this.data.moonreileigh
        this.sunSkyMaterial.luminance = this.data.moonluminance
        this.sunSkyMaterial.turbidity = this.data.moonturbidity
      }
      
      // document.querySelector('#log2').setAttribute('value', label+"r: " +`${this.sunSkyMaterial.reileigh}`+"; l:" +this.sunSkyMaterial.luminance+"; t:"+this.sunSkyMaterial.turbidity)
      // document.querySelector('#log').setAttribute('value', `sR:${this.data.sunReileigh} SL%:${Math.floor(this.currentEighthStarLoop.percent * 1000) / 1000} mR:${this.data.moonReileigh}`)
      // console.log(this.currentEighthStarLoop.which, this.sunSkyMaterial.reileigh, `${this.data.sunReileigh} -(${this.currentEighthStarLoop.percent} * (${this.data.sunReileigh} - ${this.data.moonReileigh}))`)

      this.sunSkyMaterial.sunPosition = this.sunPosition // this.version === 0 ? this.sunPosition : this.sunPos
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
            // lock at peak white while the stars are up
            if (this.glc.a > .29) this.glc.a = .29
            // this hard coded value was the observed peak at 'midnight' of a given sun cycle.
            // the range is from moon-midnight to sun-midnight, preventing drops towards black pre-moonrise and post-moon-noon
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

    lights: { // set dynamically
      posSurface: {
        z: -1,
      },
      posBeam: {},
      posHemi: {},
      
      lightHemi: {},
      lightBeam: {},
    },
  
    ranges: {
      starBright: {start:{which:3},end:{which:6}}, // sun-midnight to moon-midnight; when the stars shine
      extendedStarRange: {start:{which:2},end:{which:7}}, // includes the wax on and wane out of star range just after sunset until just before sunrise
      
      daylight: {start:{which:0},end:{which:1}}, // when sun is shining
      moonlight: {start:{which:4},end:{which:5}}, // when sun is shining
    },
  
    lightSourcesTick() {
        // this.offset = this.moon ? this.data.moonriseOffset : this.data.sunriseOffset;
        // this.el.setAttribute('rotation', 'y', -this.offset)

        // update light colors and intensities
        this.sunPos = new THREE.Vector3(this.sunPosition.x, this.sunPosition.y, this.sunPosition.z)
        this.sunPos.normalize();
        
        if (!this.data.disablealllighting) {
          this.lights.intensityMultiplier = 
            // !this.moon && this.sunOrMoonUp() ? 
            this.inRange(this.ranges.daylight) ?
              this.data.sunintensity : // daylight
            // this.moon && this.sunOrMoonUp() ?
            this.inRange(this.ranges.moonlight) ?
              this.data.moonintensity : // moon is up
            // this.starlight && !this.sunOrMoonUp() ?
            this.inRange(this.ranges.extendedStarRange) ?
              0.005 : // stars pre-and-post moon
              1 // shouldn't happen, flash to make reasoning error obvious
          if (this.data.debug && this.lights.intensityMultiplier===1) console.warn("light intensity calc problem")
          this.lights.intensity = this.inRange(this.ranges.extendedStarRange) ? this.data.starlightintensity : (0.1 + this.sunPos.y * this.lights.intensityMultiplier);
          // this.lights.lightProps.intensity = this.lights.lightProps.intensity < this.data.starlightintensity ? this.data.starlightintensity : this.lights.lightProps.intensity;
          // document.getElementById('lamp').setAttribute('light',this.lights.lightProps);
          // console.log(this.lights.lightProps.intensity, this.lights.intensityMultiplier)
          

          this.lights.lightHemi.color = this.getLightColor(1);
          this.lights.lightBeam.color = this.lights.lightHemi.color

          // document.querySelector('#log2').setAttribute('value', this.lights.intensityMultiplier + " m=>i " + this.cleanNumber(this.lights.lightProps.intensity) + "  |s: " +  this.cleanNumber(this.sunPosition.y) + " |c " + this.lights.lightProps.color)
        }
        // adding to garbage collection overhead--make all objects here into local re-used objects
        if (this.data.showsurfacelight) {
          this.lights.posSurface.x = -this.sunPosition.x;
          this.lights.posSurface.y = this.sunPosition.y
          this.sunlight.setAttribute('position', this.lights.posSurface); // new experimental version 
          this.sunlight.setAttribute('light', this.lights.lightHemi);
        }

        if (this.data.showhemilight || this.data.showshadowlight) {
          this.sunshaderToSunbeam();
        }

        if (this.data.showhemilight) {
          this.lights.lightHemi.intensity = this.lights.intensity < this.data.starlightintensity ? this.data.starlightintensity : this.lights.intensity;
          // delete this.lights.lightProps.castShadow; // delete because hemilight complains
          this.hemilight.setAttribute('light', this.lights.lightHemi);
        }

        if (this.data.showshadowlight) {
          this.sunbeam.setAttribute('position', this.toD3);
          this.lights.lightBeam.castShadow = this.sunOrMoonUp(); // should actually specify eighths where sun/moon are up.
          this.lights.lightBeam.intensity = this.sunOrMoonUp() ? this.lights.intensity : 0
          this.sunbeam.setAttribute('light', this.lights.lightBeam);
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
      this.toD3.x = ( (this.data.sunbeamdistance) * Math.sin(this.theta) * Math.cos(this.phi()) );
      this.toD3.y = ( this.data.sunbeamdistance) * Math.sin(this.theta) * Math.sin(this.phi() );
      this.toD3.z = -( (this.data.sunbeamdistance) * Math.cos(this.theta) );
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
