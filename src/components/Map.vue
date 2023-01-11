<script setup lang="ts">
import * as THREE from 'three';
import { DoubleSide, PerspectiveCamera, ZeroCurvatureEnding } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from "gsap";
import { ref } from 'vue';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'lil-gui';

const sizes = {
  x: window.innerWidth,
  y: window.innerHeight,
  mapX: 4,
  mapY: 8,
  mapZ: 0.5
}

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

// Créer une fonction "setPosition" qui prend en entrée le x, y (et potentiellement z) en pourcentage pour positionner l'utilisateur sur la carte.
camera.rotation.x = Math.PI/2;
camera.position.z = -sizes.mapZ/2;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( sizes.x, sizes.y );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById("app")?.appendChild( renderer.domElement );

// Initialiser la map :
const map = initMap();
// Initialiser la flèche de positionnement :
let arrow: THREE.Mesh | void = initArrow();

navigator.geolocation.watchPosition((position) => {
  // console.log(position);
  pos.value = {
    ...pos.value,
    lat: position.coords.latitude,
    long: position.coords.longitude
  };
});

const points = new THREE.Group();
for (let i = 0; i < 6; i++) {
  points.add(initPoint());
}

// Environement :
const env = new THREE.Group();
env.add(map);
env.add(points)
env.position.y = sizes.mapX+.5;
scene.add( env );

// Camera group :
const camGroup = new THREE.Group();
camGroup.add(camera);
scene.add( camGroup );


// Lights :
const light = new THREE.PointLight( 0xffffff, 1, 100 );
light.position.set( 0, 0, 0 );
scene.add( light );


const gui = new dat.GUI()
gui.add(env.position, 'y', 0, 8, .01).name('Map Y');
gui.add(env.position, 'x', -2, 2, .01).name('Map X');

// env.position.y = 3.45;
setTimeout(() => {
  // gui.add(arrow.position, 'y', -10, 10, .01).name('Arrow Y');
  // gui.add(arrow.position, 'x', -10, 10, .01).name('Arrow X');
  // gui.add(arrow.position, 'z', -10, 10, .01).name('Arrow Z');
}, 1000);

// Animate :
const clock = new THREE.Clock();
const animate = () => {
  window.requestAnimationFrame(animate);

  const nearest = getNearestPos();
  const dist = Math.sqrt(Math.abs(nearest.x - camera.position.x)**2 + Math.abs(nearest.y - camera.position.y)**2);

  if ((dist < 1) && (dist > -1)) {
    const angle = pos.value.x - Math.atan2(nearest.y - camera.position.y, nearest.x - camera.position.x);
    const distance = camera.position.distanceTo(nearest);

    arrow && gsap.to(arrow.position, {
      x: distance * Math.cos(-angle),
      y: distance * Math.sin(-angle),
      z: -sizes.mapZ + .075 + Math.cos(clock.getElapsedTime() * 2) * .01,
      duration: 0
    });

    arrow && gsap.to(arrow.rotation, {
      x: Math.PI/2,
      y: arrow.rotation.y + .01,
      z: -Math.PI/2,
      duration: 0
    });

  } else {
    arrow && gsap.to(arrow.position, {
      x: 0,
      y: sizes.mapZ,
      z: -sizes.mapZ + .025,
      duration: .1
    });

    arrow && gsap.to(arrow.rotation, {
      x: Math.PI/2 + (pos.value.y * .4),
      y: Math.atan2(nearest.y - camGroup.position.y, nearest.x - camGroup.position.x) - pos.value.x,
      z: 0,
      duration: 0
    });
  }

  camGroup.rotation.z = pos.value.x;

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

// Fonctions : 

function initMap(): THREE.Mesh {
  const mapGeometry = new THREE.PlaneGeometry( sizes.mapX, sizes.mapY );
  const mapTexture = new THREE.TextureLoader().load( '/map.svg' );

  const mapMaterial = new THREE.MeshBasicMaterial({
    map: mapTexture,
    side: DoubleSide
  });
  const mapMesh = new THREE.Mesh( mapGeometry, mapMaterial );

  mapMesh.position.z -= sizes.mapZ;
  return mapMesh;
}

function initArrow(): void {
  // import gltf of arrow :
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

function getNearestPos(): THREE.Vector3 {
  const getRealPosition = (point: THREE.Vector3) => {
    return new THREE.Vector3(
      point.x + env.position.x,
      point.y + env.position.y,
      point.z + env.position.z
    );
  }
  const nearest = points.children.sort((a, b) => {
    return getRealPosition(a.position).distanceTo(camera.position) - getRealPosition(b.position).distanceTo(camera.position);
  })[0];
  return getRealPosition(nearest.position);
}

function initPoint(): THREE.Mesh {
  const pointGeometry = new THREE.SphereGeometry( .1, 16, 16 );
  const pointMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFC31E,
    metalness: .5,
    roughness: 0.2,
  });
  const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

  pointMesh.scale.set(
    .25,
    .25,
    .25,
  )
  setPositionOnMap(pointMesh, 75, 10);

  return pointMesh;
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

function setPositionOnMap(element:THREE.Mesh, x:number = 0, y:number = 0) {
  element.position.set(
    x/100 * sizes.mapX - sizes.mapX/2,
    y/100 * sizes.mapY - sizes.mapY/2,
    -sizes.mapZ
  );
}

</script>

<template>
  <div id="panel" @click="init">
    Start
    {{ pos }}
  </div>
</template>

<style>
  body,
  html,
  canvas {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    margin: 0;
  }
  #panel {
    position: fixed;
    z-index: 1000;
    color: aliceblue;
  }
</style>
