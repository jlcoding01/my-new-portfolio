/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  Terminal,
  Cpu,
  Layers,
  Zap,
  Shield,
  Github,
  Linkedin,
  ArrowUpRight,
} from "lucide-react";
import ScrollStack, { ScrollStackItem } from "./components/ScrollStack";
import ProfileCard from "./components/ProfileCard";
import PixelCard from "./components/PixelCard";
import avatar from "./assets/avatar.JPG";

// --- Types ---
interface Point {
  x: number;
  y: number;
  z: number;
  ox: number; // original x
  oy: number; // original y
  oz: number; // original z
  vx: number;
  vy: number;
  vz: number;
}

// --- Constants ---
const PARTICLE_COUNT = 3000;
const DONUT_R = 160; // Major radius
const DONUT_r = 70; // Minor radius
const PERSPECTIVE = 500;
const INTERACTION_RADIUS = 150;
const DAMPING = 0.95;
const MOUSE_FORCE = 0.12;
const RETURN_FORCE = 0.02;

// --- Canvas 3D Donut Component ---
const CanvasDonut = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const pointsRef = useRef<Point[]>([]);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 600], [1, 0.1]);

  useEffect(() => {
    const points: Point[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;

      const x = (DONUT_R + DONUT_r * Math.cos(theta)) * Math.cos(phi);
      const y = (DONUT_R + DONUT_r * Math.cos(theta)) * Math.sin(phi);
      const z = DONUT_r * Math.sin(theta);

      points.push({ x, y, z, ox: x, oy: y, oz: z, vx: 0, vy: 0, vz: 0 });
    }
    pointsRef.current = points;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let rx = 0;
    let ry = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      rx += 0.005;
      ry += 0.008;

      const points = pointsRef.current;
      const mouse = mouseRef.current;

      ctx.fillStyle = "#DA205A";

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // 1. Rotation (Rotate the original coordinates to get target position)
        const cosX = Math.cos(rx);
        const sinX = Math.sin(rx);
        const cosY = Math.cos(ry);
        const sinY = Math.sin(ry);

        // Target rotated position
        let tx = p.ox * cosY - p.oz * sinY;
        let tz = p.ox * sinY + p.oz * cosY;
        let ty = p.oy * cosX - tz * sinX;
        tz = p.oy * sinX + tz * cosX;

        // 2. Interaction
        const scale = PERSPECTIVE / (PERSPECTIVE + p.z);
        const px = p.x * scale + centerX;
        const py = p.y * scale + centerY;

        const dx = mouse.x - px;
        const dy = mouse.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < INTERACTION_RADIUS) {
          const force = (INTERACTION_RADIUS - dist) / INTERACTION_RADIUS;
          p.vx -= dx * force * MOUSE_FORCE;
          p.vy -= dy * force * MOUSE_FORCE;
        }

        // 3. Physics: Move towards target rotated position (Elasticity)
        p.vx += (tx - p.x) * RETURN_FORCE;
        p.vy += (ty - p.y) * RETURN_FORCE;
        p.vz += (tz - p.z) * RETURN_FORCE;

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.vz *= DAMPING;

        // 4. Projection & Draw
        if (p.z > -PERSPECTIVE) {
          const s = PERSPECTIVE / (PERSPECTIVE + p.z);
          const x2d = p.x * s + centerX;
          const y2d = p.y * s + centerY;

          const alpha = Math.max(0.1, (p.z + 250) / 500);
          ctx.globalAlpha = alpha;

          ctx.beginPath();
          ctx.arc(x2d, y2d, s * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resize);
    resize();
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    mouseRef.current = { x: clientX, y: clientY };
  };

  return (
    <motion.canvas
      ref={canvasRef}
      style={{ opacity }}
      onMouseMove={handleInteraction}
      onTouchMove={handleInteraction}
      onMouseLeave={() => (mouseRef.current = { x: -1000, y: -1000 })}
      className="fixed inset-0 z-0 touch-none"
    />
  );
};

const scrollToContactSection = () => {
  const contactSection = document.getElementById("contact");
  contactSection?.scrollIntoView({ behavior: "smooth", block: "start" });
};

// --- Sub-components ---
const Typewriter = ({ text, delay = 60 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, delay);
    return () => clearInterval(timer);
  }, [text, delay]);
  return (
    <span className="typewriter font-mono text-primary uppercase tracking-widest">
      {displayedText}
    </span>
  );
};

// --- Folder Card Content (Extracted from FolderCard for reuse) ---
const FolderCardContent = ({
  project,
  index,
}: {
  project: any;
  index: number;
}) => {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Folder Tab */}
      <div className="absolute -top-6 left-0 w-32 h-8 bg-primary/90 rounded-t-lg clip-folder-tab flex items-center px-4">
        <span className="font-mono text-[9px] uppercase tracking-widest text-white font-bold">
          Project_0{index + 1}
        </span>
      </div>

      {/* Folder Body */}
      <div className="w-full h-full bg-[#0a0a0a] rounded-tr-2xl rounded-b-2xl overflow-hidden flex flex-col border border-primary/20 shadow-2xl relative">
        <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
        <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-6 justify-between relative z-10">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/40" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
          </div>
          <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
            {project.id}.sys
          </span>
        </div>

        <div className="flex-1 p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              {project.title}
            </h3>
            <p className="font-mono text-xs text-white/50 leading-relaxed uppercase tracking-widest">
              {project.desc}
            </p>
            <div className="flex flex-wrap gap-3">
              {project.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 border border-white/10 rounded-full font-mono text-[9px] text-primary uppercase tracking-widest"
                >
                  {tag}
                </span>
              ))}
            </div>
            <motion.a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ x: 10 }}
              className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-primary pt-4 cursor-pointer"
            >
              View_Source <ArrowUpRight className="w-4 h-4" />
            </motion.a>
          </div>

          <div className="w-full md:w-1/2 aspect-video bg-white/5 rounded-xl border border-white/10 overflow-hidden relative group">
            <img
              src={project.img}
              alt={project.title}
              className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const projects = [
    {
      id: "WHAT_TO_WEAR",
      title: "What To Wear",
      desc: "A smart app that analyzes the weather and recommends the perfect outfit for your day.",
      tags: ["React", "Node.js", "PostgreSQL"],
      img: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      url: "https://wtwr-lake.vercel.app/",
    },
    {
      id: "NEWS_EXPLORER",
      title: "News Explorer",
      desc: "A news discovery app that lets users search articles by keywords and easily save or share stories.",
      tags: ["React", "Go", "Redis"],
      img: "https://images.unsplash.com/photo-1585007600263-71228e40c8d1?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      url: "https://news-explorer-frontend-umber.vercel.app/",
    },
    {
      id: "AROUND_THE_US",
      title: "Around the US",
      desc: "A social app where users can share and explore travel photos from around the US.",
      tags: ["React", "Next.js", "MongoDB"],
      img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1642&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      url: "https://jlcoding01.github.io/se_project_aroundtheus/",
    },
  ];

  return (
    <div className="relative min-h-screen bg-bg text-white overflow-x-hidden selection:bg-primary selection:text-white">
      {/* Visual Accents */}
      <div className="fixed inset-0 glow-top z-0 pointer-events-none" />
      <div className="fixed inset-0 glow-bottom z-0 pointer-events-none" />
      <div
        className="fixed inset-0 z-[-1] opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Hero Canvas */}
      <CanvasDonut />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-10 flex justify-end items-center">
        <div className="hidden md:flex gap-12 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40 mr-auto ml-auto">
          {["Home", "Projects", "About", "Expertise", "Contact"].map(
            (item, i) => (
              <motion.a
                key={item}
                href={`#${
                  item === "Home"
                    ? "home"
                    : item === "Projects"
                      ? "archive"
                      : item === "About"
                        ? "profile"
                        : item === "Expertise"
                          ? "modules"
                          : item.toLowerCase()
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="hover:text-primary transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-primary transition-all group-hover:w-full" />
              </motion.a>
            ),
          )}
        </div>
      </nav>

      {/* Hero Content */}
      <section
        id="home"
        className="relative h-screen flex flex-col justify-center items-center px-6 z-10 pointer-events-none"
      >
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <Typewriter text="> INITIALIZING_JERRY_LIU_INTERFACE... SUCCESS" />
          </motion.div>

          <h1 className="text-[11vw] md:text-[8vw] font-black leading-[0.8] tracking-tighter  mb-10">
            <motion.div
              initial={{ opacity: 0, y: 40, skewY: 5 }}
              animate={{ opacity: 1, y: 0, skewY: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.7,
              }}
              className="text-primary italic"
            >
              Hi, I am
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 40, skewY: 5 }}
              animate={{ opacity: 1, y: 0, skewY: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.9,
              }}
            >
              Jerry Liu
            </motion.div>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="font-mono text-[10px] md:text-xs text-white/30 uppercase tracking-[0.6em] max-w-2xl mx-auto leading-loose"
          >
            FUll Stack Engineer/Entrepreneur
          </motion.p>
        </div>

        {/* HUD Elements */}
        <div className="absolute bottom-12 left-8 right-8 flex justify-end items-end">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2 }}
            className="flex flex-col items-end gap-6 pointer-events-auto"
          >
            <div className="flex gap-8">
              <a
                href="https://github.com/jlcoding01"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
              </a>
              <a
                href="https://www.linkedin.com/in/jerryliuintech/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
              </a>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/20 mb-1">
                Scroll_to_Decrypt
              </span>
              <div className="w-32 h-[1px] bg-white/10 relative overflow-hidden">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-1/2 bg-primary/40"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Project Stack Section */}
      <section id="archive" className="relative z-10 py-40">
        <div className="max-w-7xl mx-auto mb-20 px-8 w-full">
          <span className="font-mono text-primary text-xs uppercase tracking-[0.5em] mb-4 block">
            01
          </span>
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            Projects
          </h2>
        </div>

        <ScrollStack
          useWindowScroll={true}
          itemDistance={window.innerHeight * 0.8}
          itemStackDistance={30}
          baseScale={0.92}
          itemScale={0.015}
          stackPosition="15%"
        >
          {projects.map((project, i) => (
            <ScrollStackItem
              key={project.id}
              itemClassName="!bg-transparent !border-none !shadow-none !p-0 !min-h-0 aspect-auto md:aspect-[16/10] min-h-[600px] md:min-h-0"
            >
              <FolderCardContent project={project} index={i} />
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </section>

      {/* Profile Section */}
      <section id="profile" className="relative z-10 py-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="w-full lg:flex-1 flex justify-center">
              <PixelCard
                variant="pink"
                gap={8}
                speed={40}
                colors="#DA205A,#FF4D8D,#8B153A"
                className="w-full max-w-[460px] aspect-[0.718]"
              >
                <ProfileCard
                  name=""
                  title=""
                  handle="Jerry_Liu"
                  status="Build with impact."
                  contactText="Contact Me"
                  avatarUrl={avatar}
                  onContactClick={scrollToContactSection}
                  className="!shadow-none !border-none"
                  enableTilt={true}
                />
              </PixelCard>
            </div>
            <div className="w-full lg:flex-1 space-y-8">
              <span className="font-mono text-primary text-xs uppercase tracking-[0.5em] block">
                02
              </span>
              <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">
                About
              </h2>
              <p className="font-mono text-sm text-white/40 leading-loose max-w-xl uppercase tracking-widest">
                I bring ideas to life with efficient code and innovative
                solutions. Beyond coding, I embrace the mindset of an
                Entrepreneur, constantly exploring new opportunities to create
                impactful products. Let's build something extraordinary
                together.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8">
                <div>
                  <div className="text-primary font-mono text-2xl font-bold mb-2">
                    05+
                  </div>
                  <div className="text-white/20 font-mono text-[10px] uppercase tracking-widest">
                    Years_Exp
                  </div>
                </div>
                <div>
                  <div className="text-primary font-mono text-2xl font-bold mb-2">
                    42+
                  </div>
                  <div className="text-white/20 font-mono text-[10px] uppercase tracking-widest">
                    Deployments
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="relative z-10 px-8 py-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <span className="font-mono text-primary text-xs uppercase tracking-[0.5em] mb-4 block">
                03
              </span>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
                Expertise
              </h2>
            </div>
            <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest max-w-xs text-right">
              Specialized in low-level visual engineering and high-performance
              interface architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Frontend",
                icon: Cpu,
                desc: "Building responsive, accessible, and high-performance UIs with React and Next.js.",
              },
              {
                title: "Backend",
                icon: Layers,
                desc: "Designing scalable microservices, RESTful APIs, and robust database schemas.",
              },
              {
                title: "Cloud_DevOps",
                icon: Shield,
                desc: "Deploying resilient infrastructure on AWS/GCP with Docker and Kubernetes.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="glass p-12 rounded-2xl group hover:border-primary/40 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 font-mono text-4xl font-black">
                  0{i + 1}
                </div>
                <item.icon className="w-12 h-12 text-primary mb-10 group-hover:scale-110 transition-transform duration-500" />
                <h3 className="font-mono text-xl font-bold mb-6 uppercase tracking-tight">
                  {item.title}
                </h3>
                <p className="font-mono text-[11px] text-white/40 leading-relaxed uppercase tracking-widest">
                  {item.desc}
                </p>
                <div className="mt-12 flex justify-between items-center">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((b) => (
                      <div
                        key={b}
                        className="w-4 h-1 bg-primary/20 group-hover:bg-primary/60 transition-colors"
                      />
                    ))}
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="relative z-10 py-40 px-8 border-t border-white/5"
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="inline-block glass px-6 py-2 rounded-full font-mono text-[10px] uppercase tracking-[0.4em] mb-12 text-primary"
          >
            Status: Ready To Build
          </motion.div>
          <h2 className="text-6xl md:text-[10vw] font-black uppercase tracking-tighter mb-16 leading-none">
            Contact
          </h2>
          <div className="flex flex-wrap justify-center gap-12">
            {[
              { name: "Github", url: "https://github.com/jlcoding01" },
              {
                name: "Linkedin",
                url: "https://www.linkedin.com/in/jerryliuintech/",
              },
              { name: "Email", url: "mailto:ljliu89@gmail.com" },
            ].map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs uppercase tracking-[0.5em] hover:text-primary transition-all relative group"
              >
                {link.name}
                <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-primary transition-all group-hover:w-full" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-12 px-8 flex justify-between items-center border-t border-white/5 font-mono text-[9px] uppercase tracking-[0.5em] text-white/20">
        <span>Jerry Liu // 2025</span>
      </footer>
    </div>
  );
}
