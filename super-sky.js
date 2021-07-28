AFRAME.registerComponent('super-sky', {
    schema: {
      cycleDuration: {
        // time for one sun cycle. If moon cycle is enabled, then a full day will be twice this length.
        type: 'number',
        default: 1, // in minutes
      },
      moonCycle: {
        // turn on/off moon cycle; also turns off stars. Nights are 'just black' when false.
        // relies on setting and controlling 'fog' component for a-scene.
        // night becomes 3x length, and features a 'moon' for 1/3 of that
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
      }
    },
    init: function () {
      // this.orbitEl = this.el.sceneEl.querySelector('#orbit');
      // <a-sky color="black" opacity=0></a-sky>
      // <a-entity id="stars" star-system="count:0;"></a-entity>
      this.starSky = document.createElement('a-sky');
      this.starSky.setAttribute('id', 'starSky');
      this.starSky.setAttribute('opacity', 0);
      this.stars = document.createElement('a-entity');
      this.stars.setAttribute('id', 'stars');
      this.stars.setAttribute('star-system','count',0);
      this.el.sceneEl.appendChild(this.starSky);
      this.el.sceneEl.appendChild(this.stars);
      this.startTime = Date.now();
      if (this.data.throttle) {
        this.tick = AFRAME.utils.throttleTick(this.tick, this.data.throttle, this);
      }
    },
    starCycle: 0, // dynamic
    fogValue: 0, // dynamic
    fogRangeMax: 1000,
    getOrbit() {
      // converts time passed into a fraction of 360, so 0,1,2...359,360,0,1...etc.
      const msSinceStart = Date.now() - this.startTime;
      const minSinceStart = msSinceStart / 1000 / 60;
      const minIntoCycle = minSinceStart % this.data.cycleDuration;
      const fractionOfCurrentCycleCycle = minIntoCycle * ( 1 / this.data.cycleDuration );
      return 360 * fractionOfCurrentCycleCycle;
    },

    moon: false,
    moonSunSwitchFlag: false,

    getEighth(orbit) {
      // dividing day and night each into four cycles, we get 8 total cycles. 
      // returns a corresponding value from 0-7 for which eighth of day you are in
      // also returns what percent through that eighth you are

      // 90 === 360/4
      const quarterCount = Math.floor( orbit / 90 );
      return {
        which: this.moon ? quarterCount + 4 : quarterCount,
        percent: ((orbit % 90) * (1/90)),
      }
    },

    handleMoonCycle(orbit) {
      if (orbit < this.data.starLoopStart && this.moonSunSwitchFlag) {
        this.moonSunSwitchFlag = false;
      }
      if (orbit > this.data.starLoopStart && !this.moonSunSwitchFlag) {
        console.log("switching sun/moon", orbit, 'moon:', this.moon)
        this.moon=!this.moon;
        this.el.setAttribute('material', 'reileigh', this.moon ? 0.1 : 1);
        this.el.setAttribute('material', 'luminance', this.moon ? 1.18 : 1);
        this.moonSunSwitchFlag = true;
        if (this.moon) {
          console.log('switch to moon cycle, set stars')
          this.el.sceneEl.setAttribute('rotation', {y:this.data.moonRise})
          this.stars.setAttribute('star-system', "count", this.data.starCount);
        } else {
          console.log('switch to sun cycle, hide stars')
          // remove stars
          this.el.sceneEl.setAttribute('rotation', {y:this.data.sunRise})
          // this.stars.setAttribute('star-system', "count", 0);
        }
      }

      // track star loop separately
      if (orbit > this.data.starLoopStart) {
        this.starLoop = orbit - this.data.starLoopStart;
      } else {
        this.starLoop = orbit + (360 - this.data.starLoopStart);
      }

      // experiment to move starLoop
      this.starCycle = this.starLoop * ( 1 / 180 ); // 0 -> 2 scale for the 0 -> 360 rotation; we do until 2 so that we can make it negative after 1.
      this.starCycle = this.starCycle > 1 ? 2 - this.starCycle : this.starCycle;

      // no creeping fog at moonset
      // this.fogValue = (this.moon && this.starLoop > 270) ?
      //   (this.fogRange.night) - (this.starCycle * this.fogRange.night) : // invert direction
      //   (this.starCycle * this.fogRange.night);

      // fog: 
      // - 0 just after sunset,
      // - 0 just before sunrise,
      // - 1 at full day
      // - 1 at full night
      const eighth = this.getEighth(this.starLoop);

      if (eighth.which === 1 && eighth.percent > .65) {
        eighth.which = 2; // cheap way to prevent shadows from increasing even after sunrise
        eighth.percent = .2 // speed up to cause shadows pre-sunrise early
      }
      if (eighth.which === 2) {
        eighth.percent = eighth.percent < .2 ? .2 : eighth.percent; // matching up beginning of 2 with faux end of 1
        eighth.percent = eighth.percent * 2 // speed up to cause shadows pre-sunrise early
      }

      if (eighth.which === 2 || eighth.which === 4) {
        // sunrise -> noon 
        // or
        // sunset -> starlight
        // less fog (so, higher fog value) as percent of eighth goes up
        this.fogValue = eighth.percent * this.fogRangeMax
        if (!this.moon) {
          this.stars.setAttribute('star-system', "count", 0);
        }
      } 
      else if (eighth.which === 3 || eighth.which === 1) {
        // noon -> sunset
        // or
        // dusk -> sunrise 
        // more fog (so, lower fog value) as percent of eighth goes up
        this.fogValue = (1 - eighth.percent) * this.fogRangeMax
        if (this.moon) {
          this.stars.setAttribute('star-system', "count", this.data.starCount);
        }
      } 
      else {
        this.fogValue = this.fogRangeMax
      }
      if (this.fogValue < this.data.fogMin) this.fogValue = this.data.fogMin;

      // if (this.moon && this.starLoop > 270) {
      //   this.fogValue = (this.fogRange.night) - (this.starCycle * this.fogRange.night);
      // } else {
      //   this.fogValue = (this.starCycle * this.fogRange.night);
      // }

          // this.stars.setAttribute('star-system', "count", this.data.starCount);
          // this.stars.setAttribute('star-system', "count", 0);

      this.el.sceneEl.setAttribute('fog', 'far', this.fogValue);
    },


    tick() {
      const orbit = this.getOrbit();
      if (this.data.moonCycle) {
        this.handleMoonCycle(orbit);
      }

      // if (orbit < 270 && this.moonSunSwitchFlag) {
      //   this.moonSunSwitchFlag = false;
      // }
      // if (orbit > 270 && !this.moonSunSwitchFlag) {
      //   console.log("switching sun/moon", orbit, 'moon:', this.moon)
      //   this.moon=!this.moon;
      //   this.el.setAttribute('material', 'reileigh', this.moon? 0.1 : 1);
      //   this.el.setAttribute('material', 'luminance', this.moon? 1.18 : 1);
      //   this.moonSunSwitchFlag = true;
      //   if (this.moon) {
      //     document.getElementById('stars').setAttribute('star-system', "count", this.data.starCount)
      //     // add stars
      //     // make sky opacity = 0 to allow moon to shine through
      //     // fog can kill stars, far=1000 to allow seeing it; 

      //     // <a-sky color="black" opacity=0></a-sky>
      //     // <a-entity star-system></a-entity>
      //   } else {
      //     // remove stars
      //     // this.el.sceneEl.setAttribute('fog', 'far', this.fogRange.day)
      //     document.getElementById('stars').setAttribute('star-system', "count", 0)

      //     // star-system count to 0
      //     // maybe use fog to hide stars?
      //   }
      // }

      // // track star loop separately
      // if (orbit > 270) {
      //   this.starLoop = orbit - 270;
      // } else {
      //   this.starLoop = orbit + 90;
      // }

      // this.starCycle = this.starLoop * ( 1 / 180 ); // 0 -> 2 scale for the 0 -> 360 rotation; we do until 2 so that we can make it negative after 1.
      // this.starCycle = this.starCycle > 1 ? 2 - this.starCycle : this.starCycle

      // this.fogValue = this.starCycle * this.fogRange.night;

      // if (this.fogValue < this.fogRange.day) this.fogValue = this.fogRange.day;
      // this.el.sceneEl.setAttribute('fog', 'far', this.fogValue)
      // if (this.moon) {
      // }

      // moving sun according to the 0 -> 360 input
      const theta = Math.PI * (- 0.25);
      const phi = 2 * Math.PI * (orbit / 360 - 0.5);
      this.el.setAttribute('material', 'sunPosition', {
        x: Math.cos(phi),
        y: Math.sin(phi) * Math.sin(theta),
        z: -1
      });
    },
});

