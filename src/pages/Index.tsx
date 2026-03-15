import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GitBranch,
  CheckSquare,
  Users,
  Moon,
  Sun,
  Shield,
  Clock,
  BarChart3,
  Zap,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function Index() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const features = [
    {
      icon: GitBranch,
      title: "Structured Workflows",
      desc: "Define sequential steps with role assignments. Tasks flow through a strict, predefined path ensuring nothing gets skipped.",
    },
    {
      icon: CheckSquare,
      title: "Task Handover",
      desc: "Every status change is an immutable record. Full accountability from assignment to completion with timestamped logs.",
    },
    {
      icon: Users,
      title: "Role-Based Access",
      desc: "Admin, Manager, and Employee roles with distinct permissions, dashboards, and operational boundaries.",
    },
    {
      icon: Shield,
      title: "Audit Trail",
      desc: "Complete history of every action. Know who did what, when, and why — perfect for compliance and reviews.",
    },
    {
      icon: Clock,
      title: "Deadline Tracking",
      desc: "Set deadlines on tasks and get automatic notifications. Never miss a critical handover again.",
    },
    {
      icon: BarChart3,
      title: "Real-time Reports",
      desc: "Visual analytics on task distribution, completion rates, and team performance at a glance.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-xl gradient-bg flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-base">W</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">WorkSync</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button size="sm" className="gradient-bg border-0 text-primary-foreground hover:opacity-90" onClick={() => navigate("/auth")}>
              Get Started <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]"
          />
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[100px]"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary mb-8"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Built for teams that need accountability
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
            >
              Sequential workflow
              <br />
              <span className="gradient-text">management</span> for teams
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Eliminate "Where is this at?" — force tasks through predefined, role-gated workflow
              steps with full accountability and real-time tracking.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="text-base px-8 h-13 gradient-bg border-0 text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => navigate("/auth")}
              >
                Start Free <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 h-13 hover:bg-secondary/80 transition-all duration-300"
                onClick={() => navigate("/auth")}
              >
                Watch Demo
              </Button>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {[
              { value: "99.9%", label: "Uptime SLA" },
              { value: "50k+", label: "Tasks Managed" },
              { value: "3x", label: "Faster Handovers" },
              { value: "100%", label: "Audit Trail" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                custom={i + 5}
                className="text-center p-4 rounded-xl glass-card card-3d"
              >
                <div className="text-2xl md:text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-border/50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
              Everything you need to <span className="gradient-text">manage workflows</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From task assignment to completion — every step is tracked, every handover is logged.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/40 card-3d transition-all duration-500"
                style={{ background: "var(--gradient-card)" }}
              >
                <div className="h-12 w-12 rounded-xl gradient-bg flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-secondary/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
              How it <span className="gradient-text">works</span>
            </h2>
            <p className="text-muted-foreground text-lg">Three steps to streamlined task management</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Define Workflow",
                desc: "Create sequential steps with role assignments. Each step gates who can act and what happens next.",
              },
              {
                step: "02",
                title: "Assign & Track",
                desc: "Managers assign tasks to employees. Every action is logged. Deadlines and notifications keep things moving.",
              },
              {
                step: "03",
                title: "Review & Complete",
                desc: "Tasks flow through approval steps. Admins get full visibility. Nothing slips through the cracks.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="relative text-center p-6 rounded-2xl glass-card card-3d"
              >
                <div className="text-6xl font-black gradient-text mb-4">{item.step}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                {i < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-5 h-6 w-6 text-primary/30" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px]"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto px-6 text-center relative"
        >
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
            Ready to <span className="gradient-text">streamline</span> your workflows?
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join teams that have eliminated task ambiguity and improved accountability.
          </p>
          <Button
            size="lg"
            className="text-base px-10 h-13 gradient-bg border-0 text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => navigate("/auth")}
          >
            Get Started for Free <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gradient-bg flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-xs">W</span>
            </div>
            <span className="text-sm font-semibold text-foreground">WorkSync</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} WorkSync. Sequential workflow management for teams.
          </p>
        </div>
      </footer>
    </div>
  );
}
