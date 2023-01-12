<script setup lang="ts">
import * as THREE from 'three';
import { PerspectiveCamera } from 'three';
import { gsap } from "gsap";
import { ref } from 'vue';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'lil-gui';

const sizes = {
  x: window.innerWidth,
  y: window.innerHeight,
  mapX: 12,
  mapY: 24,
  mapZ: 0.5
}

const checkpoints = [
  {
    x: 44.5,
    y: 7.5,
    model: '/models/map/JournalProjectMuseum.glb',
  },
  {
    x: 67.75,
    y: 17.75,
    model: '/models/map/CanvasMuseumLa_Maison_Bernot.glb',
  },
  {
    x: 50,
    y: 22.5,
    model: '/models/map/CanvasMuseumPortrait_de_Mademoiselle_Chanel.glb',
  },
  {
    x: 44.5,
    y: 30.5,
    model: '/models/map/CanvasMuseumPaullGuillaume.glb',
  },
  {
    x: 27.5,
    y: 40,
    model: '/models/map/CanvasMuseumDomenica.glb',
  },
]

let pos = ref({
  lat: -1,
  long: -1,
  x: 0, 
  y: 0,
});

const scene = new THREE.Scene();
const camera = new PerspectiveCamera(
  75,
  sizes.x / sizes.y,
  0.01,
  1000
);

camera.rotation.x = Math.PI/2;
camera.position.z = -sizes.mapZ/2;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( sizes.x, sizes.y );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById("app")?.appendChild( renderer.domElement );

const map = initMap();
let arrow: THREE.Mesh | void = initArrow();

renderer.setClearColor( 0x000000, 0 );

navigator.geolocation.watchPosition((position) => {
  pos.value = {
    ...pos.value,
    lat: position.coords.latitude,
    long: position.coords.longitude
  };
});

const points = new THREE.Group();
for (let i = 0; i < checkpoints.length; i++) {
  points.add(initPoint(checkpoints[i]));
}

// Environement :
const env = new THREE.Group();
env.add(map);
env.add(points)
env.position.y = sizes.mapX;
scene.add( env );

// Camera group :
const camGroup = new THREE.Group();
camGroup.add(camera);
scene.add( camGroup );

// Lights :
const spotLight = new THREE.SpotLight( 0xffffff, 1 );
spotLight.position.set( -1, -1, 1 );
spotLight.rotation.set(
  -Math.PI/2,
  0,
  0
);
scene.add( spotLight );

const light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

// on scroll 
window.addEventListener('scroll', () => {
  
});

const gui = new dat.GUI()
gui.add(env.position, 'y', -sizes.mapY/2, sizes.mapY/2, .01).name('Map Y');
gui.add(env.position, 'x', -sizes.mapX/2, sizes.mapX/2, .01).name('Map X');

// env.position.y = 3.45;
// setTimeout(() => {
  // gui.add(arrow.position, 'y', -10, 10, .01).name('Arrow Y');
  // gui.add(arrow.position, 'x', -10, 10, .01).name('Arrow X');
  // gui.add(arrow.position, 'z', -10, 10, .01).name('Arrow Z');
// }, 1000);

// Animate :
const clock = new THREE.Clock();
const animate = () => {
  window.requestAnimationFrame(animate);

  const nearest = getNearest();
  const nearestPos = getRealPosition(nearest.position);
  const dist = Math.sqrt(Math.abs(nearestPos.x - camera.position.x)**2 + Math.abs(nearestPos.y - camera.position.y)**2);

  gsap.to(nearest.rotation, {
    z: pos.value.x,
    duration: 0
  });

  points.children.forEach((p: any) => {
    if((p !== nearest) || ((dist > 1) && (dist < -1))) {
      p.children[1]?.traverse((o: any) => {
        if (o.isMesh && o?.material?.opacity !== 0) {
          gsap.to(o.material, {
            opacity: 0,
            duration: 1
          });
        }
      });
    }
  });
  
  if ((dist < 1) && (dist > -1)) {
    const angle = pos.value.x - Math.atan2(nearestPos.y - camera.position.y, nearestPos.x - camera.position.x);
    const distance = camera.position.distanceTo(nearestPos);

    arrow && gsap.to(arrow.position, {
      x: distance * Math.cos(-angle),
      y: distance * Math.sin(-angle),
      z: (-sizes.mapZ + .075 + (Math.cos(clock.getElapsedTime() * 2) * .01)) - (pos.value.y * .05),
      duration: 0
    });

    arrow && gsap.to(arrow.rotation, {
      x: Math.PI/2,
      y: arrow.rotation.y + .01,
      z: -Math.PI/2,
      duration: 0
    });

    nearest.children[1]?.traverse((o: any) => {
      if (o.isMesh && o?.material?.opacity !== 1) {
        gsap.to(o.material, {
          opacity: 1,
          duration: 1
        });
      }
    });

  } else {
    arrow && gsap.to(arrow.position, {
      x: 0,
      y: sizes.mapZ,
      z: -sizes.mapZ + .025 + pos.value.y * .1,
      duration: .1
    });

    arrow && gsap.to(arrow.rotation, {
      x: Math.PI/2 + (pos.value.y * .4),
      y: Math.atan2(nearestPos.y - camGroup.position.y, nearestPos.x - camGroup.position.x) - pos.value.x,
      z: 0,
      duration: 0
    });
  }

  camGroup.rotation.z = pos.value.x;
  camGroup.rotation.x = pos.value.y * .05;

  renderer.render( scene, camera );
}
animate();

// Events : 
window.addEventListener("resize", () => {
  sizes.x = window.innerWidth;
  sizes.y = window.innerHeight;

  camera.aspect = sizes.x / sizes.y;
  camera.updateProjectionMatrix();

  renderer.setSize( sizes.x, sizes.y );
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function initMap(): THREE.Mesh {
  const mapGeometry = new THREE.PlaneGeometry( sizes.mapX, sizes.mapY );
  const mapTexture = new THREE.TextureLoader().load( '/map.svg')

  const mapMaterial = new THREE.MeshBasicMaterial({
    map: mapTexture,
  });

  mapMaterial.transparent = true;

  const mapMesh = new THREE.Mesh( mapGeometry, mapMaterial );

  mapMesh.position.z -= sizes.mapZ;
  return mapMesh;
}

function initArrow(): void {
  const loader = new GLTFLoader();
  loader.load(
    '/models/map/arrow.glb',
    (gltf: any) => {
      const ArrowMesh = gltf.scene.children[0];
      camGroup.add(ArrowMesh);
      ArrowMesh.scale.set(0.05, 0.05, 0.05);
      ArrowMesh.position.set(
        0,
        sizes.mapZ,
        -sizes.mapZ
      );

      arrow = ArrowMesh;
    },
    (xhr: any) => {
      // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error: any) => {
      console.log('An error happened');
    }
  );
}

function getNearest() {
  return points.children.sort((a, b) => {
    return getRealPosition(a.position).distanceTo(camera.position) - getRealPosition(b.position).distanceTo(camera.position);
  })[0];;
}

function getRealPosition(point: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    point.x + env.position.x,
    point.y + env.position.y,
    point.z + env.position.z
  );
}

function initPoint(infos = { x:50, y:0, model: '' }): THREE.Group {
  const pointGroup = new THREE.Group();
  const pointGeometry = new THREE.ConeGeometry( .1, .2, 8 );
  const pointMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFC31E,
    metalness: .5,
    roughness: 0.2,
  });
  const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

  pointGroup.add(pointMesh);

  pointMesh.geometry.rotateX(Math.PI/2);
  pointMesh.scale.set(
    .25,
    .25,
    .25,
  )

  const loader = new GLTFLoader();
  loader.load(
    infos.model,
    (gltf: any) => {
      const painting = gltf.scene;
      pointGroup.add(painting);

      const bounding = new THREE.Box3().setFromObject(painting);
      const paintingH = bounding.max.y - bounding.min.y;

      const scale = 0.1;
      painting.scale.set(
        scale,
        scale,
        scale,
      );
      painting.rotation.set(
        Math.PI/2,
        0,
        0
      );
      painting.position.set(
        0,
        0,
        .15
      );
      painting.traverse((o: any) => {
        if (o.isMesh) {
          o.material.transparent = true;
          o.material.opacity = 0;
        }
      });
    },
    (xhr: any) => {
      // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error: any) => {
      console.log('An error happened');
    }
  );

  // setPositionOnMap(pointMesh, 75, 10);
  // const coords = convertCoords(48.862599, 2.330223);
  // const coords = convertCoords(48.865571, 2.327822);
  setPositionOnMap(pointGroup, infos.y, infos.x, -sizes.mapZ + .0125);

  return pointGroup;
}

function deviceOrientationPermission() {
  return new Promise((resolve, reject) => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      ((DeviceOrientationEvent as any).requestPermission() as Promise<PermissionState>)
        .then((permissionState) => {
          if (permissionState === "granted") {
            resolve("granted");
          }
        })
        .catch(reject);
    } else {
      if (navigator.userAgent.indexOf("Mobile") === -1) {
        reject("Not a mobile device");
      }
      resolve("granted"); // we suppose it's automatically granted (android)
    }
  });
}

function init() {
  if (!window.DeviceOrientationEvent) {
    alert("device orientation not available on your device");
    return;
  }

  deviceOrientationPermission()
  .then((result) => {
    if (result === "granted") {
      window.addEventListener("deviceorientation", (event) => {
        const rotateDegrees = event.alpha; // alpha: rotation around z-axis
        const frontToBack = event.beta; // beta: front back motion
        pos.value = {
          ...pos.value,
          x: (rotateDegrees || 0) * Math.PI / 180,
          y: (frontToBack || 0) * Math.PI / 180,
        }
      });
    }
  })
  .catch((err) => {
    alert(err.toString());
  });
}

function setPositionOnMap(element:THREE.Mesh | THREE.Group, y:number = 0, x:number = 0, z:number = -sizes.mapZ) {
  element.position.set(
    x/100 * sizes.mapX - sizes.mapX/2,
    y/100 * sizes.mapY - sizes.mapY/2,
    z
  );
}

</script>

<template>
  <div id="panel">
    <button @click="init">Start</button>
  </div>
</template>

<style>
  body,
  html,
  canvas {
    position: fixed;
    top: 0;
    left: 0;
    height: 200vh;
    width: 100%;
    margin: 0;
    background-color: #141008;
    background: url(/background.jpg) no-repeat center center fixed;
    background-size: cover;
  }
  #panel {
    position: fixed;
    z-index: 1000;
    color: aliceblue;
  }
</style>
