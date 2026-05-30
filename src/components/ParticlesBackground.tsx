"use client"

import { useEffect, useState } from "react"
import Particles from "@tsparticles/react"
import { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"

export function ParticlesBackground() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <Particles
      id="tsparticles"
      className="fixed inset-0 -z-10"
      options={{
        background: { color: { value: "#07070f" } },
        fpsLimit: 60,
        interactivity: {
          events: { onHover: { enable: true, mode: "repulse" } },
          modes: { repulse: { distance: 80, duration: 0.4 } },
        },
        particles: {
          color: { value: ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"] },
          links: {
            color: "#1e1e3a",
            distance: 120,
            enable: true,
            opacity: 0.3,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.6,
            direction: "none",
            random: true,
            outModes: { default: "bounce" },
          },
          number: { value: 260, density: { enable: true } },
          opacity: { value: { min: 0.25, max: 0.7 } },
          shape: { type: "circle" },
          size: { value: { min: 1, max: 3.5 } },
        },
        detectRetina: true,
      }}
    />
  )
}
