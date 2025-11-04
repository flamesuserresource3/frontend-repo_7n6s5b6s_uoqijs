import React from 'react';
import Spline from '@splinetool/react-spline';

export default function HeroSection() {
  return (
    <section className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden rounded-b-3xl border-b border-white/10 bg-black">
      <Spline
        scene="https://prod.spline.design/igThmltzmqv5hkWo/scene.splinecode"
        style={{ width: '100%', height: '100%' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
      <div className="absolute inset-0 flex items-end md:items-center justify-center text-center p-6 md:p-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
            AI Subtitle Generator
          </h1>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-white/80">
            Upload your media, pick a model and language, and generate precise subtitles in seconds.
          </p>
        </div>
      </div>
    </section>
  );
}
