---
title: "One Shape of Infinity"
icon: "🌀"
tagline: "A WebGPU-powered fractal explorer — zoom infinitely into the Mandelbrot set."
status: "Live"
liveUrl: "https://infinity.marl0.space"
tags: ["WebGPU", "Three.js", "Next.js", "WGSL Shaders", "React"]
order: 4
---

## What is this?

An interactive Mandelbrot set explorer built with WebGPU and Three.js. Navigate the boundary between order and chaos — pinch, zoom, drag through an infinite landscape of self-similar mathematical structure.

The Mandelbrot set is a simple formula: z = z² + c. Iterate it. Color the results. What emerges is a shape of literally infinite complexity from two lines of math. Every zoom reveals new structure. It never ends.

## Features

- **WebGPU rendering** — GPU-computed fractals at full resolution, buttery smooth
- **Infinite zoom** — explore deeper and deeper into the boundary
- **3D mode** — escape-time values rendered as height maps with dynamic lighting
- **Bookmarks** — save and return to interesting locations
- **Box selection** — draw a rectangle to zoom into any region
- **Adjustable resolution** — trade detail for performance

## The Tech

The heavy lifting happens in WGSL shaders running on the GPU. Each pixel independently iterates the Mandelbrot formula and colors based on escape time. Three.js handles the 3D rendering when you want to see the fractal as a landscape.

Built with Next.js as the application shell, React for the UI controls, and raw WebGPU/WGSL for the computation. Falls back to Three.js WebGL when WebGPU isn't available.

## Why?

Because sometimes you build things not because they're useful, but because they're beautiful. And because the boundary of the Mandelbrot set is a reminder that infinite complexity can emerge from the simplest rules.
