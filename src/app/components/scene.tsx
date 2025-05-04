"use client";

import { text } from "node:stream/consumers";
import { useEffect } from "react";
import * as THREE from 'three';
import { Reflector } from "three/examples/jsm/Addons.js";
import { Easing, Tween , update as updateTween } from "three/examples/jsm/libs/tween.module.js";

export default function Scene(){
    
    const titles = [
        'The Death of Socrates',
        'Starry Night',
        'The Great Wave off Kanagawa',
        'Effect of Spring, Giverny',
        'Mount Corcoran',
        'A Sunday on La Grande Jatte'
    ];
    
    const subtitles = [
        'Jacques-Louis David',
        'Vincent Van Gogh',
        'Katsushika Hokusai',
        'Claude Monet',
        'Albert Bierstadt',
        'George Seurat'
    ];

    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.set(0, 0.5, -1);
        
        const textureLoader = new THREE.TextureLoader();
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setAnimationLoop( animate );
        document.getElementById('body')?.appendChild(renderer.domElement);
        
        const rootNode = new THREE.Object3D();
        scene.add(rootNode)

        const letfTexture = textureLoader.load('left.png');
        const rightTexture = textureLoader.load('right.png');

        const cards: THREE.Object3D[] = [];

        const mouse = new THREE.Vector2();
        const raycasterMouse = new THREE.Raycaster();
        let hoveredCard: THREE.Object3D | null = null;

        let count = 6;

        for (let i = 0; i < count; i++) {
            const texture = textureLoader.load('socrates.jpg');
            texture.colorSpace = THREE.SRGBColorSpace;

            const baseNode = new THREE.Object3D();
            baseNode.position.x = i * 6;

            const card = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2, 0.1),
                new THREE.MeshStandardMaterial({map: texture})
            );
            card.name = `Art_${i}`
            card.userData.baseY = card.position.y;
            cards.push(card);
            card.position.z = -4;

            const leftArrow = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.3, 0.01),
                new THREE.MeshStandardMaterial({
                    map:letfTexture,
                    transparent:true,
                })
            )
            leftArrow.name = `leftArrow` 
            leftArrow.userData = { index: i - 1 };
            leftArrow.position.set(-1.8, 0, -4);

            const rightArrow = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.3, 0.01),
                new THREE.MeshStandardMaterial({
                    map:rightTexture,
                    transparent:true,
                })
            )
            rightArrow.name = `rightArrow` 
            rightArrow.userData = { index: i + 1 };
            rightArrow.position.set(1.8, 0, -4);

            baseNode.add(card);
            baseNode.add(leftArrow);
            baseNode.add(rightArrow);
            rootNode.add(baseNode);
        }
        
        const spotlight = new THREE.SpotLight(0xffffff, 300.0, 10.0, 0.65, 1);
        spotlight.position.set(0, 5, 0);
        spotlight.target.position.set(0, 0.5, -5);

        const light = new THREE.AmbientLight(0xffffff, 7.0);
        light.position.set(0, 5, 0);
        
        scene.add(light);
        const title = document.getElementById('title')
        const subtitle = document.getElementById('subtitle')
        if (title) title.innerText = titles[0];
        if (subtitle) subtitle.innerText = subtitles[0];

        function slideTo(direction: number, newIndex : Record<string, any>){
            let newX = direction * 6;
            console.log(direction);
            console.log(newIndex.index);
            
            if (direction === -1 && newIndex.index === -1) {
                newX = count * 6 - 6;
            }
            else if (direction === 1 && newIndex.index === count) {
                newX = 0;
            }
            else{
                newX = camera.position.x + newX;
            }
            
            new Tween(camera.position)
            .to({x: newX})
            .easing(Easing.Quadratic.InOut)
            .start()
            .onStart(()=>{
                if (title) title.style.opacity = '0';
                if (subtitle) subtitle.style.opacity = '0';
            })
            .onComplete(()=>{
                if (title) title.style.opacity = '1';
                if (subtitle) subtitle.style.opacity = '1';
                if (newIndex.index === count) {
                    if (title) title.innerText = titles[0];
                    if (subtitle) subtitle.innerText = subtitles[0];
                }
                else if (newIndex.index === -1){
                    if (title) title.innerText = titles[count - 1];
                    if (subtitle) subtitle.innerText = subtitles[count - 1];
                }else{
                    if (title) title.innerText = titles[newIndex.index];
                    if (subtitle) subtitle.innerText = subtitles[newIndex.index];
                }
            })
        }

        function animate() {
            raycasterMouse.setFromCamera(mouse, camera);
            const intersectsCard = raycasterMouse.intersectObjects(cards);

            if (hoveredCard && (!intersectsCard.length || intersectsCard[0].object !== hoveredCard)) {
                hoveredCard.rotation.set(0, 0, 0);
                hoveredCard = null;
            }

            const time = Date.now() * 0.001;
            cards.forEach((card, idx) => {
                const floatOffset = Math.sin(time + idx) * 0.05; // Subtle float
                card.position.y = card.userData.baseY + floatOffset;
            });
            updateTween()
            renderer.render( scene, camera );
        }

        window.addEventListener('mousemove', (ev) => {
            mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize( window.innerWidth, window.innerHeight );
        })

        window.addEventListener('click',  (ev) => {
            const raycaster = new THREE.Raycaster();

            const mouseNDC = new THREE.Vector2(
                (ev.clientX / window.innerWidth) * 2 - 1,
                -(ev.clientY / window.innerHeight) * 2 + 1
            );

            raycaster.setFromCamera(mouseNDC, camera);

            const intersections = raycaster.intersectObject(rootNode, true);
            if (intersections.length > 0) {
                const obj  = intersections[0].object;
                const newIndex = obj.userData;
                if (obj.name === "leftArrow") {
                    slideTo(-1, newIndex);
                }
                if (obj.name === "rightArrow") {
                    slideTo(1, newIndex);
                }
            }
        })
        
    })

    

    return (
        <div id="body">
            <h1 id='title'></h1>
            <h2 id='subtitle'></h2>
        </div>
    );
}