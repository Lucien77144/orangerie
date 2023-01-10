<script setup lang="ts">
import * as THREE from 'three';
import { DoubleSide, PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from "gsap";
import { ref } from 'vue';

const sizes = {
  x: window.innerWidth,
  y: window.innerHeight,
  mapX: 4,
  mapY: 8,
  mapZ: 1
}

let pos = ref({
  lat: -1,
  long: -1
});

const scene = new THREE.Scene();
const camera = new PerspectiveCamera(
  75,
  sizes.x / sizes.y,
  0.01,
  1000
);

// Créer une fonction "setPosition" qui prend en entrée le x, y (et potentiellement z) en pourcentage pour positionner l'utilisateur sur la carte.
camera.rotation.x = Math.PI/2.5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize( sizes.x, sizes.y );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById("app")?.appendChild( renderer.domElement );
// const controls = new OrbitControls( camera, renderer.domElement );

// Initialiser la map :
const map = initMap();
// Initialiser la flèche de positionnement :
const arrow = initArrow();

navigator.geolocation.watchPosition((position) => {
  // pos.value = {
  //   lat: position.coords.latitude,
  //   long: position.coords.longitude
  // };
});

const env = new THREE.Group();
env.add(map);

const points = new THREE.Group();
for (let i = 0; i < 6; i++) {
  points.add(initPoint());
}
env.add(points)
env.position.y += sizes.mapX+.5;

scene.add( env );

const animate = () => {
  window.requestAnimationFrame(animate);

  env.position.y -= .005;

  const nearest = getNearestPos();
  gsap.to(arrow.rotation, {
    y: -Math.atan2(nearest.y - arrow.position.y, nearest.x - arrow.position.x),
    duration: .5
  });

  console.log(env);

  gsap.to(camera.rotation, {
    y: -(Math.PI/2.5 + Math.atan2(nearest.z - arrow.position.z, nearest.x - arrow.position.x))/10,
    duration: .5
  });

  // controls.update();
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
  const mapMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    side: DoubleSide
  });
  const mapMesh = new THREE.Mesh( mapGeometry, mapMaterial );

  mapMesh.position.z -= sizes.mapZ;
  
  return mapMesh;
}

function initArrow(): THREE.Mesh {
  const arrowGeometry = new THREE.ConeGeometry( .2, .75, 16 );
  const arrowMaterial = new THREE.MeshBasicMaterial({
    color: 0x0000ff
  });
  const ArrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);

  scene.add(ArrowMesh);

  ArrowMesh.scale.set(.25, .25, .25);
  ArrowMesh.position.set(
    0,
    .75,
    -.75
  );
  ArrowMesh.geometry.rotateX(Math.PI/2);
  ArrowMesh.geometry.rotateY(Math.PI/2);

  return ArrowMesh;
}

function setPosition(): void {

}

function handleCamera(nearest: THREE.Vector3) : void {

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
    return getRealPosition(a.position).distanceTo(arrow.position) - getRealPosition(b.position).distanceTo(arrow.position);
  })[0];
  return getRealPosition(nearest.position);
}

function initPoint(): THREE.Mesh {
  const pointGeometry = new THREE.SphereGeometry( .1, 16, 16 );
  const pointMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000
  });
  const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

  pointMesh.scale.set(.25, .25, .25);
  pointMesh.position.set(
    Math.random()*sizes.mapX - sizes.mapX/2,
    Math.random()*sizes.mapY - sizes.mapY/2,
    -sizes.mapZ
  );
  pointMesh.rotation.x = .25;

  return pointMesh;
}

</script>

<template>
  <div id="panel">
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
