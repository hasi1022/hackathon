
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface ParticleWeatherProps {
  condition: string;
  intensity?: number;
}

export const ParticleWeather: React.FC<ParticleWeatherProps> = ({ 
  condition, 
  intensity = 1 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createParticle = (): Particle => {
      const cond = condition.toLowerCase();
      
      if (cond.includes('rain')) {
        return {
          x: Math.random() * canvas.width,
          y: -10,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 5 + 5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          life: 0,
          maxLife: 60
        };
      } else if (cond.includes('snow')) {
        return {
          x: Math.random() * canvas.width,
          y: -10,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 + 1,
          size: Math.random() * 4 + 2,
          opacity: Math.random() * 0.9 + 0.1,
          life: 0,
          maxLife: 120
        };
      } else if (cond.includes('clear') || cond.includes('sun')) {
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.random() * 0.5 - 0.25,
          vy: Math.random() * 0.5 - 0.25,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.3 + 0.1,
          life: 0,
          maxLife: 200
        };
      } else {
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.random() * 1 - 0.5,
          vy: Math.random() * 1 - 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.1,
          life: 0,
          maxLife: 100
        };
      }
    };

    const updateParticles = () => {
      particles.current = particles.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life++;
        particle.opacity = Math.max(0, 1 - particle.life / particle.maxLife);
        
        return particle.life < particle.maxLife && 
               particle.x > -50 && particle.x < canvas.width + 50 &&
               particle.y > -50 && particle.y < canvas.height + 50;
      });

      // Add new particles
      const particleCount = Math.floor(intensity * 3);
      for (let i = 0; i < particleCount; i++) {
        if (Math.random() < 0.1) {
          particles.current.push(createParticle());
        }
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.current.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        
        const cond = condition.toLowerCase();
        if (cond.includes('rain')) {
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = particle.size;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.vx, particle.y + particle.vy * 2);
          ctx.stroke();
        } else if (cond.includes('snow')) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (cond.includes('clear') || cond.includes('sun')) {
          ctx.fillStyle = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fbbf24';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      });
    };

    const animate = () => {
      updateParticles();
      drawParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [condition, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
