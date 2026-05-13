"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Ticket, SearchCheck, Timer, TriangleAlert, CheckCircle, type LucideIcon } from "lucide-react";
type Step = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const steps: Step[] = [
  {
    title: "Raise Ticket",
    description: "Submit your issue in seconds.",
    icon: Ticket,
  },
  {
    title: "Assign Agent",
    description: "Automatically routed to the right expert.",
    icon: SearchCheck,
  },
  {
    title: "Track SLA",
    description: "Live monitoring against resolution targets.",
    icon: Timer,
  },
  {
    title: "Escalate",
    description: "Priority increases if response is delayed.",
    icon: TriangleAlert,
  },
  {
    title: "Resolve",
    description: "Issue resolved and confirmed.",
    icon: CheckCircle,
  },
];

export default function TicketWorkflowStepper() {
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-index"));

          if (entry.isIntersecting) {
            setActiveIndex(index);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -20% 0px",
      },
    );

    triggerRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // const progress = activeIndex / (steps.length - 1);
  const progressCount:number[] = [0.1, 0.3, 0.5, 0.7, 1]
  const progress = progressCount[activeIndex];

  return (
    <section className="relative bg-white">
      <div className="md:block sticky top-24 z-20 bg-white md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">The path to resolution</h2>
            <p className="text-lg text-slate-500">Transparent progress every step of the way.</p>
          </div>

          <div className="relative mx-auto max-w-6xl">
            {/* desktop line */}
            <div className="absolute left-0 right-0 top-8 hidden h-1 rounded-full bg-slate-200 md:block" />
            <div
              className="absolute left-0 top-8 hidden h-1 rounded-full bg-emerald-500 md:block"
              style={{
                width: `${progress * 100}%`,
              }}
            />

            {/* mobile line */}
              <div className="absolute bottom-0 left-12 top-0 w-1 rounded-full bg-slate-200 md:hidden" />
              <div className="absolute left-12 top-0 w-1 rounded-full bg-emerald-500 md:hidden"
              style={{
                height: `${progress * 100}%`,
              }}
            />

            <div className="grid grid-cols-1 gap-10 md:grid-cols-5 md:gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === activeIndex;
                const isDone = index < activeIndex;

                return (
                  <div
                    key={step.title}
                    className="relative flex items-start gap-4 pl-4 md:flex-col md:items-center md:gap-3 md:pl-0 md:text-center"
                  >
                    <motion.div
                      animate={{
                        scale: isActive ? 1.08 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                      className={[
                        "relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 ",
                        isActive || isDone
                          ? "border-emerald-500 bg-emerald-100 text-slate-700 shadow-lg"
                          : "border-slate-200 text-slate-400 bg-white ",
                      ].join(" ")}
                    >   
                      <Icon size={28} />
                    </motion.div>

                    <div className="min-h-[80px] md:min-h-[120px]">
                      <h3
                        className={[
                          "text-lg font-semibold transition-colors",
                          isActive ? "text-slate-900" : "text-slate-500",
                        ].join(" ")}
                      >
                        {step.title}
                      </h3>

                      <motion.div
                        initial={false}
                        animate={{
                          opacity: isActive ? 1 : 0,
                          height: isActive ? "auto" : 0,
                        }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {step.description}
                        </p>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* invisible scroll triggers */}
      <div>
        {steps.map((_, index) => (
          <div
            key={index}
            ref={(el) => {
              triggerRefs.current[index] = el;
            }}
            data-index={index}
            className="h-[30vh]"
          />
        ))}
      </div>
    </section>
  );
}