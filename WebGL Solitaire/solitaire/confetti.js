class Confetti {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.colors = [
            0xFF0000, // red
            0x00FF00, // green
            0x0000FF, // blue
            0xFFFF00, // yellow
            0xFF00FF, // magenta
            0x00FFFF  // cyan
        ];
    }

    createParticle() {
        const geometry = new THREE.PlaneGeometry(0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            side: THREE.DoubleSide
        });
        const particle = new THREE.Mesh(geometry, material);

        // Random position across the screen
        particle.position.set(
            (Math.random() - 0.5) * 30,  // x: spread across width
            15,                          // y: start from top
            Math.random() * 5            // z: varying depths
        );

        // Random rotation
        particle.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        // Add physics properties
        particle.velocity = {
            x: (Math.random() - 0.5) * 2,   // random horizontal movement
            y: -Math.random() * 5 - 5,      // downward movement
            rotation: (Math.random() - 0.5) * 0.1  // rotation speed
        };

        this.scene.add(particle);
        this.particles.push(particle);
    }

    start() {
        // Create initial batch of particles
        for (let i = 0; i < 200; i++) {
            this.createParticle();
        }
    }

    update() {
        // Update each particle's position
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.position.x += particle.velocity.x * 0.1;
            particle.position.y += particle.velocity.y * 0.1;
            
            // Update rotation
            particle.rotation.x += particle.velocity.rotation;
            particle.rotation.y += particle.velocity.rotation;
            particle.rotation.z += particle.velocity.rotation;

            // Remove particles that have fallen below the screen
            if (particle.position.y < -10) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
                
                // Create a new particle to replace the removed one
                if (Math.random() < 0.3) { // 30% chance to create new particle
                    this.createParticle();
                }
            }
        }
    }

    stop() {
        // Remove all particles
        this.particles.forEach(particle => {
            this.scene.remove(particle);
        });
        this.particles = [];
    }
}

export default Confetti; 