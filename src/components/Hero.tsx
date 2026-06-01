"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const zoomWrapperRef = useRef<HTMLDivElement>(null);
  const leftDoorRef = useRef<HTMLDivElement>(null);
  const rightDoorRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const doorsContainerRef = useRef<HTMLDivElement>(null);

  // Keep track of window-scale pixel values to align textures dynamically
  const [dimensions, setDimensions] = useState({
    bgWidth: 0,
    bgHeight: 0,
    bgLeft: 0,
    bgTop: 0,
    doorwayWidth: 0,
    doorwayHeight: 0,
    doorwayLeft: 0,
    doorwayTop: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // portal_closed.png has a 1:1 square aspect ratio
      const imageAspect = 1.0;
      const viewportAspect = windowWidth / windowHeight;

      let bgWidth = 0;
      let bgHeight = 0;
      let bgLeft = 0;
      let bgTop = 0;

      // Calculate the actual scale and position of the full-screen cover image
      if (viewportAspect > imageAspect) {
        bgWidth = windowWidth;
        bgHeight = windowWidth / imageAspect;
        bgLeft = 0;
        bgTop = (windowHeight - bgHeight) / 2;
      } else {
        bgHeight = windowHeight;
        bgWidth = windowHeight * imageAspect;
        bgLeft = (windowWidth - bgWidth) / 2;
        bgTop = 0;
      }

      // The doors inside the 1:1 image are located at precise percentage coordinates:
      // Left edge of doorway: 14.8% of image width
      // Right edge of doorway: 85.2% of image width (width = 70.4% of image)
      // Top edge of doorway: 13.0% of image height
      // Bottom edge of doorway: 87.0% of image height (height = 74.0% of image)
      const doorwayWidth = bgWidth * 0.704;
      const doorwayHeight = bgHeight * 0.74;
      const doorwayLeft = bgLeft + bgWidth * 0.148;
      const doorwayTop = bgTop + bgHeight * 0.13;

      setDimensions({
        bgWidth,
        bgHeight,
        bgLeft,
        bgTop,
        doorwayWidth,
        doorwayHeight,
        doorwayLeft,
        doorwayTop,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (dimensions.bgWidth === 0) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // 1. Doors swing open (from 0% to 35% of the scroll track)
      tl.to(
        leftDoorRef.current,
        {
          rotateY: -115,
          ease: "power1.inOut",
        },
        0
      )
      .to(
        rightDoorRef.current,
        {
          rotateY: 115,
          ease: "power1.inOut",
        },
        0
      )
      // 2. Camera walkthrough dolly zoom (from 25% to 100% of the scroll track)
      // We zoom in by a large factor (4.5) to push the door frame completely off-screen
      .to(
        zoomWrapperRef.current,
        {
          scale: 4.5,
          ease: "power1.inOut",
        },
        0.25
      )
      // 3. Scenic backdrop scales slightly inside the doorway to create parallax depth
      .to(
        bgRef.current,
        {
          scale: 1.15,
          ease: "power1.inOut",
        },
        0.25
      )
      // 4. Typography floats in on top as the camera crosses the threshold (from 45% to 95%)
      .fromTo(
        textRef.current,
        {
          opacity: 0,
          scale: 0.85,
          y: 40,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          ease: "power2.out",
        },
        0.45
      );
    }, triggerRef);

    return () => ctx.revert();
  }, [dimensions]);

  return (
    <div ref={triggerRef} className="relative w-full h-[300vh] bg-black">
      {/* Pinned viewport */}
      <div
        ref={containerRef}
        className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center bg-black perspective-1500"
      >
        {/* Zoom wrapper (Contains the wall, the doorway, and the doors) */}
        <div
          ref={zoomWrapperRef}
          className="absolute inset-0 w-full h-full preserve-3d origin-center"
        >
          {/* Layer 1: Static Wall Background */}
          <div
            className="absolute inset-0 w-full h-full bg-[url('/images/portal_closed.png')] bg-cover bg-center"
          />

          {/* Layer 2: Centered Doorway Container with Ocean Backdrop */}
          {dimensions.doorwayWidth > 0 && (
            <div
              className="absolute overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] border border-white/5 bg-black"
              style={{
                width: dimensions.doorwayWidth,
                height: dimensions.doorwayHeight,
                left: dimensions.doorwayLeft,
                top: dimensions.doorwayTop,
              }}
            >
              {/* Zooming Ocean Backdrop */}
              <div
                ref={bgRef}
                className="absolute inset-0 w-full h-full bg-[url('/images/ocean_background.png')] bg-cover bg-center transition-transform"
                style={{ transform: "scale(0.95)" }}
              />
            </div>
          )}

          {/* Layer 3: Door panels pivoting on their own frames */}
          {dimensions.doorwayWidth > 0 && (
            <div
              ref={doorsContainerRef}
              className="absolute z-20 flex preserve-3d overflow-visible pointer-events-none"
              style={{
                width: dimensions.doorwayWidth,
                height: dimensions.doorwayHeight,
                left: dimensions.doorwayLeft,
                top: dimensions.doorwayTop,
              }}
            >
              {/* Left Door Panel - Pivots on its left hinge */}
              <div
                ref={leftDoorRef}
                className="absolute left-0 top-0 w-1/2 h-full origin-left bg-cover bg-no-repeat preserve-3d border-r border-white/5"
                style={{
                  backgroundImage: "url('/images/portal_closed.png')",
                  backgroundSize: `${dimensions.bgWidth}px ${dimensions.bgHeight}px`,
                  backgroundPosition: `${dimensions.bgLeft - dimensions.doorwayLeft}px ${dimensions.bgTop - dimensions.doorwayTop}px`,
                  backfaceVisibility: "hidden",
                }}
              />

              {/* Right Door Panel - Pivots on its right hinge */}
              <div
                ref={rightDoorRef}
                className="absolute right-0 top-0 w-1/2 h-full origin-right bg-cover bg-no-repeat preserve-3d border-l border-white/5"
                style={{
                  backgroundImage: "url('/images/portal_closed.png')",
                  backgroundSize: `${dimensions.bgWidth}px ${dimensions.bgHeight}px`,
                  backgroundPosition: `${dimensions.bgLeft - (dimensions.doorwayLeft + dimensions.doorwayWidth / 2)}px ${dimensions.bgTop - dimensions.doorwayTop}px`,
                  backfaceVisibility: "hidden",
                }}
              />
            </div>
          )}
        </div>

        {/* Layer 4: Cinematic Typography (z-30) - Outside zoomWrapper so size remains stable */}
        <div
          ref={textRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6"
          style={{ opacity: 0 }}
        >
          <p className="font-body text-xs md:text-sm font-bold tracking-[0.4em] uppercase text-[#f1f1f1]/80 mb-4">
            A PRIVATE TRAVEL DESIGNER
          </p>
          <h1 className="font-display text-5xl md:text-8xl font-bold tracking-tight text-white uppercase max-w-4xl leading-none">
            BEYOND THE HORIZON.<br />
            <span className="text-[#f1f1f1]">UNCHARTED.</span>
          </h1>
          <p className="font-body text-sm md:text-base font-normal tracking-wide text-[#f1f1f1]/70 max-w-xl mt-6 leading-relaxed">
            Bespoke expedition planning and private travel design for those who seek the next level of discovery. We map routes that do not exist on public search engines.
          </p>
          <div className="flex gap-4 mt-10 pointer-events-auto">
            <a
              href="#inquiry"
              className="font-body text-[10px] font-bold tracking-[0.2em] uppercase px-8 py-4 rounded-sm bg-[#f1f1f1] text-[#010101] hover:bg-white transition-colors duration-200"
            >
              GET CALLBACK
            </a>
            <a
              href="#destinations"
              className="font-body text-[10px] font-bold tracking-[0.2em] uppercase px-8 py-4 rounded-sm border border-white/20 text-white hover:bg-white/5 transition-colors duration-200"
            >
              EXPLORE DESTINATIONS
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-35 flex flex-col items-center gap-2 pointer-events-none animate-pulse">
          <span className="font-body text-[9px] font-medium tracking-[0.3em] uppercase text-[#f1f1f1]/50">
            SCROLL TO ENTER
          </span>
          <ArrowDown className="w-4 h-4 text-[#f1f1f1]/50" />
        </div>
      </div>
    </div>
  );
}
