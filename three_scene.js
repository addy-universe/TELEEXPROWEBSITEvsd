/**
 * 3D Interactive Background (Three.js + GSAP)
 * Creates a vast particle field and geometric objects that react to scroll.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Scene Setup
    const canvas = document.getElementById('webglCanvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030A14');
    scene.fog = new THREE.FogExp2('#030A14', 0.0015);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.z = 100;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Particles
    const particlesCount = 3000;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 1200;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const createCircleTexture = () => {
        const matCanvas = document.createElement('canvas');
        matCanvas.width = 64;
        matCanvas.height = 64;
        const ctx = matCanvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.2, 'rgba(0,123,255,1)');
        grad.addColorStop(0.5, 'rgba(0,123,255,0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        const texture = new THREE.Texture(matCanvas);
        texture.needsUpdate = true;
        return texture;
    };

    const particlesMaterial = new THREE.PointsMaterial({
        size: 8,
        map: createCircleTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: 0x40d9ff
    });

    const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleMesh);

    // 5. Abstract Geometric Objects
    const objects = [];
    const objMaterial = new THREE.MeshBasicMaterial({
        color: 0x007BFF,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });

    const torus1 = new THREE.Mesh(new THREE.TorusGeometry(80, 2, 16, 100), objMaterial);
    torus1.position.set(-150, 0, -100);
    scene.add(torus1);
    objects.push(torus1);

    const sphere1 = new THREE.Mesh(new THREE.IcosahedronGeometry(120, 1), objMaterial);
    sphere1.position.set(200, 0, -400);
    scene.add(sphere1);
    objects.push(sphere1);

    const torus2 = new THREE.Mesh(new THREE.TorusGeometry(200, 1, 16, 100), objMaterial);
    torus2.position.set(0, -100, -800);
    torus2.rotation.x = Math.PI / 2;
    scene.add(torus2);
    objects.push(torus2);

    // 6. GSAP ScrollTrigger Integration
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        gsap.to(camera.position, {
            z: -400,
            ease: 'none',
            scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1.5
            }
        });

        gsap.to(camera.rotation, {
            z: Math.PI / 8,
            x: -0.1,
            ease: 'none',
            scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 2
            }
        });

        objects.forEach((obj, i) => {
            gsap.to(obj.rotation, {
                x: Math.PI * 2 * (i % 2 === 0 ? 1 : -1),
                y: Math.PI * 1.5,
                ease: 'none',
                scrollTrigger: {
                    trigger: document.body,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1
                }
            });
        });
    }

    // 7. Mouse Parallax — tracked independently from the render loop
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // 8. Animation Loop (single authoritative function — no reassignment)
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // Ambient particle drift
        particleMesh.rotation.y = elapsedTime * 0.05;
        particleMesh.rotation.x = elapsedTime * 0.02;

        // Subtle object bob
        objects.forEach((obj, i) => {
            obj.position.y += Math.sin(elapsedTime * 2 + i) * 0.1;
        });

        // Smooth mouse parallax
        camera.position.x += (mouseX * 20 - camera.position.x) * 0.02;
        camera.position.y += (mouseY * 20 - camera.position.y) * 0.02;

        renderer.render(scene, camera);
    }

    animate();

    // 9. Handle Window Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
});
