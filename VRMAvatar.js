//expression setup
var expressionyay = 0;
var expressionoof = 0;
var expressionlimityay = 0.5;
var expressionlimitoof = 0.5;
var expressionease = 100;
var expressionintensity = 0.75;

class VRMAvatar {

    constructor() {
      // Add your setup code here
      this.mouththreshold = 10;
      this.mouthboost = 10;
      this.bodythreshold = 10;
      this.bodymotion = 10;
      this.expression = 80;
      this.clock = new THREE.Clock();
      // renderer
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      document.body.appendChild(this.renderer.domElement);
  
      // camera
      this.camera = new THREE.PerspectiveCamera(30.0, window.innerWidth / window.innerHeight, 0.1, 20.0);
      this.camera.position.set(0.0, 1.45, 0.75);
  
      // camera controls
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.screenSpacePanning = true;
      this.controls.target.set(0.0, 1.45, 0.0);
      this.controls.update();
  
      // scene
      this.scene = new THREE.Scene();
  
      // light
      this.light = new THREE.DirectionalLight(0xffffff);
      this.light.position.set(1.0, 1.0, 1.0).normalize();
      this.scene.add(this.light);
  
      // lookat target
      this.lookAtTarget = new THREE.Object3D();
      this.camera.add(this.lookAtTarget);
  
      // gltf and vrm
      this.currentVrm = undefined;
      this.loader = new THREE.GLTFLoader();

      // Bind the onWindowResize method to the class instance
      this.onWindowResize = this.onWindowResize.bind(this);

      // Bind the interface and hideinterface methods
      this.interface = this.interface.bind(this);
      this.hideinterface = this.hideinterface.bind(this);
      // Check for initial values and call the interface method
      if (this.initvalues === true) {
        if (localStorage.localvalues) {
          this.initvalues = false;
          document.getElementById("mouththreshold").value = this.mouththreshold;
          document.getElementById("mouthboost").value = this.mouthboost;
          document.getElementById("bodythreshold").value = this.bodythreshold;
          document.getElementById("bodymotion").value = this.bodymotion;
          document.getElementById("expression").value = this.expression;
        }
      }
  
      this.interface();

      // Call the load function with the default VRM URL
      this.loadDefaultVRM();

      // Add the event listener for window resize
      window.addEventListener('resize', this.onWindowResize, false);
      // Add the event listener for dismissing non-vrm divs
      // document.getElementById("backplate").addEventListener("click", this.hideinterface);
    }
  
    // Load VRM from a given URL
    load(url) {
      this.loader.crossOrigin = 'anonymous';

      this.loader.load(
        url,
        (gltf) => {
          // THREE.VRMUtils.removeUnnecessaryVertices( gltf.scene ); // Vroid VRM can't handle this for some reason
          THREE.VRMUtils.removeUnnecessaryJoints(gltf.scene);

          THREE.VRM.from(gltf).then((vrm) => {
            if (this.currentVrm) {
              this.scene.remove(this.currentVrm.scene);
              this.currentVrm.dispose();
            }

            this.currentVrm = vrm;
            this.scene.add(vrm.scene);

            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Hips).rotation.y = Math.PI;
            vrm.springBoneManager.reset();

            // un-T-pose
            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.RightUpperArm).rotation.z = 250;
            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.RightLowerArm).rotation.z = -0.2;
            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.LeftUpperArm).rotation.z = -250;
            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.LeftLowerArm).rotation.z = 0.2;

            // randomise init positions
            function randomsomesuch() {
              return (Math.random() - 0.5) / 10;
            }

            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Head).rotation.x = randomsomesuch();
            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Head).rotation.y = randomsomesuch();
            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Head).rotation.z = randomsomesuch();

            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Neck).rotation.x = randomsomesuch();
            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Neck).rotation.y = randomsomesuch();
            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Neck).rotation.z = randomsomesuch();

            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Spine).rotation.x = randomsomesuch();
            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Spine).rotation.y = randomsomesuch();
            vrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Spine).rotation.z = randomsomesuch();

            vrm.lookAt.target = this.lookAtTarget;
            vrm.springBoneManager.reset();

            this.currentVrm = vrm;
            this.scene.add(vrm.scene);
            console.log(vrm);
          });
        },
        (progress) => console.log('Loading model...', (100.0 * progress.loaded) / progress.total, '%'),
        (error) => console.error(error)
      );
    }

    // Load the default VRM
    loadDefaultVRM() {
      const defaultVRMURL = 'https://automattic.github.io/VU-VRM/assets/VU-VRM-elf.vrm';
      this.load(defaultVRMURL);
    }
  
    // Other methods for handling mic listener, interface, etc.
    blink() {
      // Generate a random blink timeout between 50ms and 300ms
      const blinkTimeout = Math.floor(Math.random() * 250) + 50;
    
      // Move the lookAtTarget position to simulate blinking
      this.lookAtTarget.position.y = camera.position.y - camera.position.y * 2 + 1.25;
    
      // After the blinkTimeout, reset the eye blink blend shapes to open eyes
      setTimeout(() => {
        this.currentVrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.BlinkL, 0);
        this.currentVrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.BlinkR, 0);
      }, blinkTimeout);
    
      // Set the eye blink blend shapes to close eyes
      this.currentVrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.BlinkL, 1);
      this.currentVrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.BlinkR, 1);   
    }

    // Parse audio stream and animate on audio detection
    moveMouth(stream) {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const javascriptNode = audioContext.createScriptProcessor(256, 1, 1);

      analyser.smoothingTimeConstant = 0.5;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);

      javascriptNode.onaudioprocess = function () {
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var values = 0;

        var length = array.length;
        for (var i = 0; i < length; i++) {
          values += array[i];
        }

        // audio in expressed as one number
        var average = values / length;
        var inputvolume = average;

        // audio in spectrum expressed as array
        // console.log(array.toString());
        // useful for mouth shape variance

        // move the interface slider
        document.getElementById("inputlevel").value = inputvolume;

        // mic based / endless animations (do stuff)
        if (this.currentVrm != undefined) {
          // best to be sure

          // talk
          if (talktime == true) {
            // todo: more vowelshapes
            var voweldamp = 53;
            var vowelmin = 12;
            if (inputvolume > mouththreshold * 2) {
              this.currentVrm.blendShapeProxy.setValue(
                THREE.VRMSchema.BlendShapePresetName.A,
                ((average - vowelmin) / voweldamp) * (mouthboost / 10)
              );
            } else {
              this.currentVrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.A, 0);
            }
          }
        }
      };
    }
  
    // Animate avatar
    animate(stream) {
      this.moveMouth(stream);

      requestAnimationFrame(this.animate.bind(this));
  
      const deltaTime = this.clock.getDelta();
  
      if (this.currentVrm) {
        this.currentVrm.update(deltaTime);
      }
  
      this.renderer.render(this.scene, this.camera);

      this.animate(stream);

      // loop blink timing
      (function loop() {
        var rand = Math.round(Math.random() * 10000) + 1000;
        setTimeout(function () {
          blink();
          loop();
        }, rand);
      })();
    }

    interface() {
      this.mouththreshold = document.getElementById("mouththreshold").value;
      this.mouthboost = document.getElementById("mouthboost").value;
      this.bodythreshold = document.getElementById("bodythreshold").value;
      this.bodymotion = document.getElementById("bodymotion").value;
  
      this.expression = document.getElementById("expression").value;
      this.expressionlimityay = this.expression;
      this.expressionlimitoof = 100 - this.expression;
      this.expressionlimityay = this.expressionlimityay / 100;
      this.expressionlimitoof = this.expressionlimitoof / 100;
      this.expressionlimityay = this.expressionlimityay * this.expressionintensity;
      this.expressionlimitoof = this.expressionlimitoof * this.expressionintensity;
  
      console.log("Expression " + this.expressionyay + " yay / " + this.expressionoof + " oof");
      console.log("Expression mix " + this.expressionlimityay + " yay / " + this.expressionlimitoof + " oof");
  
      // Store values in local storage
      localStorage.localvalues = 1;
      localStorage.mouththreshold = this.mouththreshold;
      localStorage.mouthboost = this.mouthboost;
      localStorage.bodythreshold = this.bodythreshold;
      localStorage.bodymotion = this.bodymotion;
      localStorage.expression = this.expression;
    }
  
    hideinterface() {
      // var a = document.getElementById("backplate");
      var b = document.getElementById("interface");
      var x = document.getElementById("infobar");
      var y = document.getElementById("credits");
      a.style.display = "none";
      b.style.display = "none";
      x.style.display = "none";
      y.style.display = "none";
    }

    onWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

  }
  